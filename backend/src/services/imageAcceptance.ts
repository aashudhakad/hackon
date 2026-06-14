import { env } from '../config/env';

/**
 * Image acceptance validation (Task 10.1).
 *
 * Property 8 (Requirement 3.7): a file is accepted for vision processing if and
 * only if it is JPEG/PNG and <= 10 MB; otherwise it is rejected and the user
 * stays on the Intent_Hub.
 */
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const;

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

export interface ImageAcceptance {
  accepted: boolean;
  reason?: 'format' | 'size';
  message?: string;
}

export function checkImageAcceptance(mimeType: string, sizeBytes: number): ImageAcceptance {
  if (!SUPPORTED_IMAGE_TYPES.includes(mimeType as SupportedImageType)) {
    return {
      accepted: false,
      reason: 'format',
      message: 'Supported image formats are JPEG and PNG (max 5 MB).',
    };
  }
  if (sizeBytes > env.limits.maxImageBytes) {
    return {
      accepted: false,
      reason: 'size',
      message: 'File size greater than 5 MB. Supported formats are JPEG and PNG.',
    };
  }
  return { accepted: true };
}
