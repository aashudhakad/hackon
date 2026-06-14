import { env } from '../config/env';

/**
 * Audio clip acceptance bounds (Task 11.1).
 *
 * Property 28 (Requirements 13.7, 13.18, 13.20): a clip is accepted for
 * recognition if and only if its duration is > 1s AND its size is <= 10 MB.
 * Otherwise it is discarded with the corresponding message:
 *  - too-short / empty  -> "no audio" message (record again)
 *  - oversize (>10 MB)  -> "oversize" message (record again)
 */
const MIN_DURATION_MS = 1000;

export interface AudioAcceptance {
  accepted: boolean;
  reason?: 'no-audio' | 'oversize';
  message?: string;
}

export function checkAudioAcceptance(durationMs: number, sizeBytes: number): AudioAcceptance {
  // Oversize takes precedence as an explicit, distinct failure (Requirement 13.18).
  if (sizeBytes > env.limits.maxAudioBytes) {
    return {
      accepted: false,
      reason: 'oversize',
      message: 'The recording exceeded the maximum allowed size of 10 MB. Please record again.',
    };
  }
  if (durationMs <= MIN_DURATION_MS) {
    return {
      accepted: false,
      reason: 'no-audio',
      message: 'No audio was captured. Please record again.',
    };
  }
  return { accepted: true };
}
