import { env } from '../config/env';
import { logger } from '../config/logger';
import { withTimeout } from '../utils/async';
import { KNOWN_CATEGORIES, KNOWN_CATEGORY_SET } from './categories';

/**
 * Gemini intent → categories service.
 *
 * This is the dedicated "backend → LLM" function in the request flow:
 *   frontend → backend API (controller) → generateCategoriesForIntent (here) → Gemini API
 *
 * Given a free-text user intent in ANY language, it asks Gemini which product
 * categories (from the fixed catalog category list) are needed to fulfil that
 * intent, and returns a validated list of category keys.
 */

const REQUEST_TIMEOUT_MS = 12_000;

/** Builds the AI-friendly prompt combining the intent with the category list. */
function buildPrompt(intent: string): string {
  return [
    'You are the shopping-intent engine for "Amazon Instant Engine", an intent-first',
    'shopping app. Instead of searching for products, the user states an OUTCOME they',
    'want to achieve (a goal, recipe, situation, or need). Your job is to decompose that',
    'intent into the product CATEGORIES required to fulfil it.',
    '',
    'The user intent may be written in ANY language (English, Hindi, Hinglish, etc.).',
    'Understand the meaning regardless of language.',
    '',
    'You may ONLY choose categories from this exact list (snake_case keys):',
    JSON.stringify(KNOWN_CATEGORIES),
    '',
    'Rules:',
    '1. Return ONLY categories that are genuinely needed for the intent.',
    '2. Use the EXACT category keys from the list above. Do not invent new keys.',
    '3. Order the categories by importance (most essential first).',
    '4. Return between 1 and 12 categories. Prefer the most relevant ones.',
    '5. If the intent is a recipe or dish, include its key ingredients that exist in the list.',
    '6. If nothing in the list is relevant, return an empty array.',
    '',
    'Respond with STRICT JSON in exactly this shape, and nothing else:',
    '{ "categories": ["category_key_1", "category_key_2"] }',
    '',
    `User intent: """${intent}"""`,
  ].join('\n');
}

/** Validates and de-duplicates raw category strings against the known set. */
export function sanitizeCategories(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const key = String(item).trim().toLowerCase();
    if (KNOWN_CATEGORY_SET.has(key) && !seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

/** Calls the Gemini generateContent REST endpoint and returns parsed categories. */
async function callGemini(intent: string): Promise<string[]> {
  const url =
    `${env.gemini.baseUrl}/models/${env.gemini.model}:generateContent?key=${env.gemini.apiKey}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: buildPrompt(intent) }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
    },
  };

  const res = await withTimeout(
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    REQUEST_TIMEOUT_MS,
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gemini HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const textOut = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  let parsed: unknown;
  try {
    parsed = JSON.parse(textOut);
  } catch {
    // Model occasionally wraps JSON in prose/fences; extract the first {...} or [...].
    const match = textOut.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    parsed = match ? JSON.parse(match[0]) : {};
  }

  const categories =
    Array.isArray(parsed) ? parsed : (parsed as { categories?: unknown }).categories;
  return sanitizeCategories(categories);
}

/**
 * Local fallback: matches known categories whose tokens appear in the intent.
 * Used when Gemini is not configured or the call fails, so the app stays usable.
 */
export function localCategoryMatch(intent: string): string[] {
  const text = intent.toLowerCase();
  const matches: string[] = [];
  for (const category of KNOWN_CATEGORIES) {
    const words = category.split('_');
    // Match if the full phrase (spaced) or every token appears in the intent.
    const phrase = words.join(' ');
    if (text.includes(phrase) || words.every((w) => w.length > 2 && text.includes(w))) {
      matches.push(category);
    }
  }
  return matches.slice(0, 12);
}

/**
 * Public entry point used by controllers. Tries Gemini first, then falls back
 * to the local matcher. Always returns validated category keys.
 */
export async function generateCategoriesForIntent(intent: string): Promise<string[]> {
  const trimmed = intent.trim();
  if (trimmed.length === 0) return [];

  if (env.geminiEnabled) {
    try {
      const categories = await callGemini(trimmed);
      if (categories.length > 0) return categories;
      logger.warn('Gemini returned no categories; using local fallback');
    } catch (err) {
      logger.warn('Gemini call failed; using local fallback', {
        error: (err as Error).message,
      });
    }
  }

  return localCategoryMatch(trimmed);
}
