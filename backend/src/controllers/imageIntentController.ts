import { Request, Response } from 'express';
import path from 'path';
import { logger } from '../config/logger';
import { UnsupportedImageError } from '../errors';
import { imageIntentService } from '../services/imageIntentService';
import { tempImageStore } from '../services/tempImageStore';

/**
 * POST /api/image-intent — image (multipart field `image`) -> shopping intent.
 *
 * Flow: upload -> temp disk storage (via imageIntentUpload middleware) ->
 * Gemini Vision intent extraction -> validated `{ intent, categories }`. The
 * categories feed the SAME downstream catalog/relevance pipeline used by the
 * text and voice flows.
 *
 * The temp file is always deleted in `finally`, so cleanup happens even when
 * processing fails. A periodic sweeper removes any stragglers after 5 minutes.
 */
export async function processImageIntent(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    throw new UnsupportedImageError('No image file was provided.');
  }

  logger.info('image-intent: upload received', {
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
  });
  logger.info('image-intent: file stored', { file: path.basename(file.path) });

  try {
    const result = await imageIntentService.extract(file.path, file.mimetype);
    res.json(result);
  } finally {
    await tempImageStore.remove(file.path);
  }
}
