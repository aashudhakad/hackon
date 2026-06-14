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
 * Image → classified shopping understanding (Gemini Vision).
 *
 * Reuses the existing Gemini integration. Rather than forcing every image into
 * a goal/intent workflow, it FIRST classifies WHY the user uploaded the image
 * (product / restock / recipe / goal / event / unknown), then derives the
 * appropriate shopping intent and the smallest practical set of catalog
 * categories. A clear product photo (e.g. a popcorn packet) resolves to the
 * product itself ("Buy popcorn" → ["popcorn"]) instead of over-expanding into
 * a broad goal ("Movie night" → snacks, drinks, chocolates).
 *
 * The result keeps `intent` + `categories` (consumed by the downstream
 * catalog/relevance pipeline and the frontend) and adds `imageType` and
 * `exactProductSignals` for richer handling. Categories are constrained to the
 * known catalog list (via sanitizeCategories); if vision returns none that map,
 * we reuse the text category pipeline rather than duplicating that logic.
 */

export type ImageType = 'product' | 'restock' | 'recipe' | 'goal' | 'event' | 'unknown';

const IMAGE_TYPES: readonly ImageType[] = [
  'product',
  'restock',
  'recipe',
  'goal',
  'event',
  'unknown',
];

export interface ImageIntentResult {
  intent: string;
  categories: string[];
  imageType: ImageType;
  /** Optional brand/product clues when image_type is "product". */
  exactProductSignals: string[];
}

/** Gemini call budget for the vision pass (kept tight for the <5s target). */
const VISION_GEMINI_TIMEOUT_MS = 15_000;

function buildVisionPrompt(): string {
  return [
    'You are an IMAGE UNDERSTANDING ENGINE for an intent-first quick-commerce app.',
    'A shopper has uploaded a single IMAGE. Your job is to determine WHY they',
    'uploaded it and turn that into an accurate shopping request.',
    '',
    'DO NOT force every image into a broad goal/intent. First figure out what the',
    'shopper is actually trying to achieve, then respond accordingly.',
    '',
    'STEP 1 — CLASSIFY the image into exactly ONE image_type:',
    '- "product": a specific packaged/branded item, bottle, box, grocery good',
    '  (e.g. popcorn packet, Coca-Cola bottle, shampoo bottle, biscuit pack,',
    '  toothpaste). The shopper most likely wants THAT product or a close match.',
    '- "restock": a shelf, pantry, refrigerator, kitchen cabinet, storage/inventory',
    '  area. The shopper wants to replenish missing or low-stock items.',
    '- "recipe": a recipe screenshot, cooking instructions, dish photo, or meal',
    '  prep content. The shopper wants the core ingredients to make the dish.',
    '- "goal": an image representing a desired outcome/setup (gym setup, study',
    '  desk, coffee corner, travel setup).',
    '- "event": a social occasion/gathering (movie night, birthday party, house',
    '  party, celebration).',
    '- "unknown": classification confidence is low.',
    '',
    'STEP 2 — PRODUCT PRIORITY:',
    'If you are confident the image shows a specific purchasable product, PREFER',
    'the product interpretation over a goal interpretation, and do NOT expand into',
    'broader bundles unless there is strong contextual evidence.',
    '- Coca-Cola bottle -> "Buy Coca-Cola"  (NOT "Summer refreshment essentials")',
    '- Popcorn packet    -> "Buy popcorn"    (NOT "Movie night bundle")',
    'Populate exact_product_signals with brand/product clues you can read (e.g.',
    '["Act II Popcorn"]). Never hallucinate brands you cannot actually see.',
    '',
    'STEP 3 — INTENT + CATEGORIES per type:',
    '- product: primary_intent like "Buy <product>"; categories = the 1-2 catalog',
    '  categories that product belongs to. Keep it tight.',
    '- restock: primary_intent like "Restock <place>"; categories = the missing /',
    '  replenishment items.',
    '- recipe: primary_intent like "Make <dish>"; categories = CORE ingredients',
    '  only (no exhaustive pantry lists).',
    '- goal: primary_intent = the outcome; categories = what is needed to achieve it.',
    '- event: primary_intent = the occasion; practical consumables only.',
    '- unknown: be conservative; small, safe category set.',
    '',
    'CATEGORY RULES:',
    '- You may ONLY choose categories from this exact list (lowercase keys):',
    JSON.stringify(KNOWN_CATEGORIES),
    '- PRECISION > RECALL. Return the smallest practical set; do NOT pad.',
    '- No keyword-only matches, accessories, decorative items, toys, or gadgets.',
    '- Prefer 1-5 categories for "product" images.',
    '- Prefer 3-8 categories for "recipe", "goal", and "event" images.',
    '- Order categories by necessity (most essential first).',
    `- primary_intent must be a short human-readable phrase (<= ${env.limits.maxIntentChars} chars).`,
    '',
    'Return STRICT JSON ONLY, with this exact shape and nothing else:',
    '{',
    '  "image_type": "product|restock|recipe|goal|event|unknown",',
    '  "primary_intent": "short human-readable intent",',
    '  "exact_product_signals": ["optional brand or product clues"],',
    '  "categories": ["category_key_1", "category_key_2"]',
    '}',
  ].join('\n');
}

interface ValidatedVision {
  intent: string;
  categories: string[];
  imageType: ImageType;
  exactProductSignals: string[];
}

/**
 * Validates a raw Gemini vision payload. Returns the trimmed intent, image
 * type, product signals, and sanitized (known, de-duped, normalized)
 * categories, or null if the intent is missing/empty/too long. Categories may
 * be empty here; the caller backfills them from the text pipeline.
 */
function validate(raw: unknown): ValidatedVision | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as {
    image_type?: unknown;
    primary_intent?: unknown;
    intent?: unknown;
    exact_product_signals?: unknown;
    categories?: unknown;
  };

  // Accept primary_intent (new) or intent (legacy) for resilience.
  const intent = String(obj.primary_intent ?? obj.intent ?? '').trim();
  if (intent.length === 0 || intent.length > env.limits.maxIntentChars) return null;

  const rawType = String(obj.image_type ?? '').trim().toLowerCase();
  const imageType = (IMAGE_TYPES as readonly string[]).includes(rawType)
    ? (rawType as ImageType)
    : 'unknown';

  const exactProductSignals = Array.isArray(obj.exact_product_signals)
    ? obj.exact_product_signals
        .map((s) => String(s).trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const categories = sanitizeCategories(obj.categories);
  return { intent, categories, imageType, exactProductSignals };
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

  logger.info('image-intent: classified', {
    imageType: validated.imageType,
    intent: validated.intent,
    exactProductSignals: validated.exactProductSignals,
  });
  console.log(
    `\n[Image intent] type: ${validated.imageType} | intent: "${validated.intent}"` +
      (validated.exactProductSignals.length
        ? ` | signals: ${validated.exactProductSignals.join(', ')}`
        : '') +
      '\n',
  );

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
  return {
    intent: validated.intent,
    categories,
    imageType: validated.imageType,
    exactProductSignals: validated.exactProductSignals,
  };
}

export const imageIntentService = { extract };
