import { promises as fsp } from 'fs';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { LLMUnavailableError, NoIntentError } from '../errors';
import { KNOWN_CATEGORIES } from './categories';
import {
  callGeminiVisionJSON,
  generateCategoriesForIntent,
  sanitizeCategories,
} from './geminiClient';

/**
 * Image → Intent → Categories service (Gemini Vision).
 *
 * Reuses the existing Gemini integration to act as an INTENT EXTRACTION ENGINE,
 * not an object detector: it infers the user's need/goal/outcome from an image
 * and produces the same `{ intent, categories }` shape the text and voice flows
 * feed into the downstream catalog/relevance pipeline.
 *
 * Categories are constrained to the known catalog category list (via
 * sanitizeCategories) so downstream product retrieval works unchanged. If the
 * vision model omits valid categories, we reuse the text category pipeline
 * (generateCategoriesForIntent) rather than duplicating that logic here.
 */

export interface ImageIntentResult {
  intent: string;
  categories: string[];
}

/** Gemini call budget for the vision pass (kept tight for the <5s target). */
const VISION_GEMINI_TIMEOUT_MS = 15_000;

function buildVisionPrompt(): string {
  return [
    'You are an INTENT EXTRACTION ENGINE for an intent-first quick-commerce app.',
    'You are given a single IMAGE uploaded by a shopper.',
    '',
    'CRITICAL: You are NOT an object detector.',
    'Do NOT list every visible object.',
    "Infer the user's NEED, GOAL, or desired OUTCOME — what are they trying to",
    'achieve, and what would they realistically want to buy right now?',
    '',
    'Think about the real-world situation the image represents, then decide what',
    'a human would shop for to fulfill it.',
    '',
    'Examples (image -> shopping intent):',
    '- Photo of a near-empty fridge -> "Restock refrigerator essentials"',
    '- Screenshot of a paneer bhurji recipe -> "Make paneer bhurji"',
    '- Living room set up for a film -> "Movie night snacks"',
    '- Photo of a kitchen shelf / pantry -> "Pantry restock"',
    '- Birthday party decorations -> "Birthday celebration essentials"',
    '',
    'After deciding the intent, choose the SMALLEST PRACTICAL set of product',
    'categories needed to fulfill it.',
    '',
    'You may ONLY choose categories from this exact list (lowercase keys):',
    JSON.stringify(KNOWN_CATEGORIES),
    '',
    'Rules:',
    '- PRECISION > RECALL. Return fewer categories rather than padding.',
    '- Exclude decorative, accessory, toy, gadget, or keyword-only matches.',
    '- Prefer 3 to 8 categories, ordered by necessity (most essential first).',
    '- If the image implies a narrow need, return fewer categories.',
    `- The intent must be a short human-readable phrase (<= ${env.limits.maxIntentChars} chars).`,
    '',
    'Return STRICT JSON only, with this exact shape and nothing else:',
    '{ "intent": "string", "categories": ["category_key_1", "category_key_2"] }',
  ].join('\n');
}

interface ValidatedVision {
  intent: string;
  categories: string[];
}

/**
 * Validates a raw Gemini vision payload. Returns the trimmed intent and the
 * sanitized (known, de-duped, normalized) categories, or null if the intent is
 * missing/empty/too long. Categories may be empty here; the caller backfills
 * them from the text pipeline.
 */
function validate(raw: unknown): ValidatedVision | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as { intent?: unknown; categories?: unknown };

  const intent = String(obj.intent ?? '').trim();
  if (intent.length === 0 || intent.length > env.limits.maxIntentChars) return null;

  const categories = sanitizeCategories(obj.categories);
  return { intent, categories };
}

async function readAsBase64(filePath: string): Promise<string> {
  const buffer = await fsp.readFile(filePath);
  if (buffer.length === 0) {
    throw new NoIntentError();
  }
  return buffer.toString('base64');
}

/**
 * Runs the vision pass once. Returns a validated result (intent + possibly
 * empty categories) or null when the model output is malformed.
 */
async function attempt(prompt: string, base64: string, mimeType: string): Promise<ValidatedVision | null> {
  logger.info('image-intent: Gemini vision request started', { mimeType });
  const raw = await callGeminiVisionJSON(prompt, base64, mimeType, VISION_GEMINI_TIMEOUT_MS);
  logger.info('image-intent: Gemini vision response received');
  return validate(raw);
}

/**
 * Extracts a shopping intent and categories from an uploaded image file.
 *
 * - Retries once if the model output is malformed.
 * - Backfills categories from the text pipeline when the vision model returns
 *   none that map to the catalog.
 * - Throws a controlled AppError on unrecoverable failure; never crashes.
 */
async function extract(filePath: string, mimeType: string): Promise<ImageIntentResult> {
  if (!env.geminiEnabled) {
    // No deterministic image fallback exists; surface a controlled error.
    throw new LLMUnavailableError('Image understanding is currently unavailable.');
  }

  const base64 = await readAsBase64(filePath);
  const prompt = buildVisionPrompt();

  let validated: ValidatedVision | null = null;
  let lastError: unknown;

  // One initial attempt + one retry on malformed/failed output.
  for (let attemptNo = 1; attemptNo <= 2 && !validated; attemptNo++) {
    try {
      validated = await attempt(prompt, base64, mimeType);
      if (!validated) {
        logger.warn('image-intent: malformed vision output', { attempt: attemptNo });
      }
    } catch (err) {
      lastError = err;
      logger.warn('image-intent: vision attempt failed', {
        attempt: attemptNo,
        error: (err as Error).message,
      });
    }
  }

  if (!validated) {
    if (lastError) {
      throw new LLMUnavailableError('Could not analyze the image. Please try again.');
    }
    // Model responded but never produced a usable intent.
    throw new NoIntentError();
  }

  logger.info('image-intent: intent extracted', { intent: validated.intent });
  console.log(`\n[Image intent] extracted intent: "${validated.intent}"\n`);

  // Backfill categories from the shared text pipeline if vision produced none.
  let categories = validated.categories;
  if (categories.length === 0) {
    logger.info('image-intent: no categories from vision, using text category pipeline');
    categories = await generateCategoriesForIntent(validated.intent);
  }

  if (categories.length === 0) {
    throw new NoIntentError();
  }

  logger.info('image-intent: categories extracted', { count: categories.length, categories });
  console.log(`[Image intent] categories:`, categories, '\n');
  return { intent: validated.intent, categories };
}

export const imageIntentService = { extract };
