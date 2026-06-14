import { env } from '../config/env';
import { EmptyIntentError, IntentTooLongError } from '../errors';

/**
 * Intent input normalization helpers (Task 2.1).
 *
 * Property 3 (Requirements 1.9, 1.10): typed Intent_Bar input is capped at 200
 * characters and trimmed before processing.
 * Property 18 (Requirement 7.5): intents longer than 500 characters are rejected
 * while the original text is preserved for the caller to retain.
 */

/**
 * Caps raw Intent_Bar input at the 200-char limit. This mirrors the front-end
 * hard cap; characters beyond the cap are dropped (not an error).
 */
export function capIntentBarInput(raw: string): string {
  const cap = env.limits.intentBarCharCap;
  return raw.length > cap ? raw.slice(0, cap) : raw;
}

/** Trims leading/trailing whitespace from intent text (Requirement 1.10). */
export function trimIntent(raw: string): string {
  return raw.trim();
}

/**
 * Returns true when the text has at least one non-whitespace character.
 * Used to gate the submit action (Requirement 1.8).
 */
export function isSubmittable(raw: string): boolean {
  return raw.trim().length > 0;
}

/**
 * Validates submission length against the 500-char maximum (Requirement 7.5).
 * Throws IntentTooLongError (preserving rawText) when exceeded.
 * Throws EmptyIntentError for empty/whitespace-only input (Requirement 1.8).
 *
 * Returns the trimmed text ready for the parser.
 */
export function validateAndPrepareIntent(rawText: string): string {
  if (rawText.length > env.limits.maxIntentChars) {
    throw new IntentTooLongError(rawText);
  }
  const trimmed = trimIntent(rawText);
  if (trimmed.length === 0) {
    throw new EmptyIntentError();
  }
  return trimmed;
}
