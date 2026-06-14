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
    'You are the Intent Decomposer for an intent-first quick-commerce app.',
    'Your job is to convert a user intent into the SMALLEST PRACTICAL set of product categories needed to fulfill that intent immediately.',
    '',
    'IMPORTANT: PRECISION > RECALL.',
    'Return fewer categories if needed. Do NOT pad the list.',
    'Do NOT return semantically adjacent or keyword-matching categories unless they are truly required.',
    '',
    'The user intent may be in any language: English, Hindi, Hinglish, or mixed.',
    'Understand the meaning, not just the words.',
    '',
    'You may ONLY choose categories from this exact list (snake_case keys):',
    JSON.stringify(KNOWN_CATEGORIES),
    '',
    'Classify the intent internally before answering:',
    '- recipe / cooking',
    '- restock / staples',
    '- event / entertainment',
    '- travel / commute',
    '- home / hostel / new setup',
    '- office / study',
    '- health / recovery',
    '- baby / family',
    '- seasonal / weather-based',
    '- gift / celebration',
    '- emergency / urgent need',
    '- general lifestyle need',
    '',
    'Decision rules:',
    '1. Return only categories a real person would actually buy for this situation.',
    '2. Exclude irrelevant but keyword-similar categories.',
    '3. Exclude accessories, toys, beauty items, gadgets, or variants that merely contain a matching word.',
    '4. If the intent is narrow, return fewer categories.',
    '5. If the intent is broad, return a balanced set, usually 3 to 8 categories.',
    '6. Never return decorative, optional, or low-priority categories unless the user explicitly asks for them.',
    '7. Order categories by necessity: most essential first.',
    '8. If nothing in the list is relevant, return an empty array.',
    '',
    'Special rules by intent type:',
    '',
    'A) Recipe / cooking intent:',
    '- Return the core ingredients and essential prep items only.',
    '- Usually 3 to 7 categories.',
    '- Include the main ingredient plus only the most necessary supporting ingredients.',
    '- Do NOT include garnish, decorative items, or exhaustive pantry items.',
    '- Do NOT return just the main ingredient if the dish clearly needs supporting ingredients.',
    '',
    'Examples:',
    '- "Paneer bhurji" should include categories like paneer, onion, tomato, green chilli, cooking oil/butter, and only the most essential spices if present in the catalog.',
    '- Do NOT return unrelated categories like hair oil, shampoo, or toys just because a word matches.',
    '',
    'B) Restock / staples intent:',
    '- Return only practical replenishment items that match the user’s stated need.',
    '- Focus on everyday essentials, not premium extras.',
    '',
    'C) Event / entertainment intent:',
    '- Return consumables and immediate-use items only.',
    '- Example: movie night => snacks, cold drinks, popcorn, chocolate, paper plates if relevant.',
    '- Do NOT return TV, speakers, sofa, or similar unrelated products.',
    '',
    'D) Travel / office / home / hostel / emergency intent:',
    '- Return starter essentials and immediate-use items only.',
    '- Think like a human shopping quickly for the situation.',
    '',
    'E) Health / recovery intent:',
    '- Return comfort, hydration, and basic relief items only, if they exist in the category list.',
    '',
    'F) Vague intent:',
    '- Infer the most likely practical shopping goal from context, but stay conservative.',
    '- Prefer a smaller accurate set over a broad noisy set.',
    '',
    'Strict output format:',
    'Return STRICT JSON only, and nothing else.',
    'Use this exact shape:',
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
  const parsed = await callGeminiJSON(buildPrompt(intent));
  const categories =
    Array.isArray(parsed) ? parsed : (parsed as { categories?: unknown }).categories;
  return sanitizeCategories(categories);
}

/**
 * Generic Gemini call returning parsed JSON. Shared by the category extractor
 * and the homepage personalization service. Throws if Gemini is unreachable.
 */
export async function callGeminiJSON(prompt: string): Promise<unknown> {
  const url =
    `${env.gemini.baseUrl}/models/${env.gemini.model}:generateContent?key=${env.gemini.apiKey}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
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

  try {
    return JSON.parse(textOut);
  } catch {
    // Model occasionally wraps JSON in prose/fences; extract the first {...} or [...].
    const match = textOut.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : {};
  }
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
      if (categories.length > 0) {
        logger.info('[Gemini] categories returned', { intent: trimmed, categories });
        console.log(`\n[Gemini categories] intent: "${trimmed}"\n→`, categories, '\n');
        return categories;
      }
      logger.warn('Gemini returned no categories; using local fallback');
    } catch (err) {
      logger.warn('Gemini call failed; using local fallback', {
        error: (err as Error).message,
      });
    }
  }

  const fallback = localCategoryMatch(trimmed);
  console.log(`\n[Fallback categories] intent: "${trimmed}"\n→`, fallback, '\n');
  return fallback;
}
