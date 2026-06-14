import multer from 'multer';
import { env } from '../config/env';

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
