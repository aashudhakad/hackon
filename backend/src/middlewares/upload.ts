import multer from 'multer';
import { env } from '../config/env';
import { UnsupportedImageError } from '../errors';
import { SUPPORTED_IMAGE_TYPES, SupportedImageType } from '../services/imageAcceptance';
import { tempImageStore } from '../services/tempImageStore';

/**
 * Multer in-memory upload configs for image (vision) and audio endpoints.
 * Size limits enforce the 10 MB caps; format checks are handled in the
 * acceptance validators so we can return domain-shaped errors.
 */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.limits.maxImageBytes },
});

export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.limits.maxAudioBytes },
});

/**
 * Disk-storage upload for the image-intent endpoint. Writes the upload to a
 * temporary directory under a unique, timestamped filename so the file can be
 * streamed to Gemini and then deleted. Unsupported formats are rejected up
 * front (before any bytes are written) and oversize uploads are capped by the
 * 10 MB limit (surfaced as a MulterError -> 400 by the error handler).
 */
export const imageIntentUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tempImageStore.dir),
    filename: (_req, file, cb) => cb(null, tempImageStore.uniqueName(file.originalname)),
  }),
  limits: { fileSize: env.limits.maxImageBytes },
  fileFilter: (_req, file, cb) => {
    if (SUPPORTED_IMAGE_TYPES.includes(file.mimetype as SupportedImageType)) {
      cb(null, true);
    } else {
      cb(new UnsupportedImageError());
    }
  },
});
