import { Request, Response } from 'express';
import { UnsupportedImageError } from '../errors';
import { checkImageAcceptance } from '../services/imageAcceptance';
import { visionProcessor } from '../services/visionProcessor';
import { intentParser } from '../services/intentParser';
import { bundleService } from '../services/bundleService';
import { crossSellEngine } from '../services/crossSellEngine';
import { catalogRepository } from '../repositories/catalogRepository';
import { ImageInput } from '../types/domain';

/**
 * POST /api/vision — image -> text intent -> StructuredIntent -> bundle.
 *
 * Validates format/size (Req 3.7), runs the Vision_Processor under its 30s
 * budget (Req 3.3, 3.9), then converges on the SAME IntentParser path as typed
 * intent (Req 7.2). Routing only proceeds with a valid structured intent
 * (Property 7, Req 3.5) — i.e. when this returns 200 with a bundle.
 */
export async function processVision(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    throw new UnsupportedImageError('No image file was provided.');
  }

  const acceptance = checkImageAcceptance(file.mimetype, file.size);
  if (!acceptance.accepted) {
    throw new UnsupportedImageError(acceptance.message);
  }

  const image: ImageInput = {
    mimeType: file.mimetype as ImageInput['mimeType'],
    sizeBytes: file.size,
    data: file.buffer,
  };

  const intentText = await visionProcessor.analyze(image);
  const intent = await intentParser.parse(intentText);

  const { bundle, cached } = await bundleService.getOrGenerate(intent);
  const catalog = await catalogRepository.getCatalog();
  const crossSell = crossSellEngine.select(bundle, catalog);

  res.json({ intent, bundle, crossSell, cached });
}
