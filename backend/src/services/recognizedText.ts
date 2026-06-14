import { env } from '../config/env';

/**
 * Recognized-text normalization (Task 11.5).
 *
 * Property 30 (Requirements 13.11, 13.12, 13.15): the value populated into the
 * editable Intent_Bar equals the recognized text trimmed and capped at the
 * first 200 characters; if the normalized value is empty, the bar is NOT
 * populated (null) which gates the "no speech recognized" path.
 */
export function prepareRecognizedText(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const cap = env.limits.intentBarCharCap;
  return trimmed.length > cap ? trimmed.slice(0, cap) : trimmed;
}
