import { logger } from '../config/logger';
import { env } from '../config/env';
import { callGeminiJSON } from './geminiClient';
import { Product, TierName, TIER_NAMES } from '../types/domain';

/**
 * Second Gemini pass: RELEVANCE + RANKING.
 *
 * Given the user intent and the candidate products fetched per category
 * (slimmed to id/name/ratings/noOfRatings/price), Gemini:
 *   1. drops products that are not genuinely the item implied by the category
 *      (e.g. removes "banana sipper"/"banana phone toy" from "banana"),
 *   2. ranks the remaining relevant products best-first (smart blend of rating,
 *      popularity and price),
 *   3. composes 3 smart bundles (Budget/Balanced/Premium), one product per
 *      category per tier.
 *
 * Returns null on any failure so the caller can fall back to deterministic
 * ratings-based ranking.
 */

export interface RankedShop {
  quick: { category: string; productIds: string[] }[];
  flash: Record<TierName, string[]>;
}

interface SlimProduct {
  id: string;
  name: string;
  mainCategory: string;
  subCategory: string;
  category: string;
  ratings: number;
  noOfRatings: number;
  price: number;
}

function toSlim(p: Product): SlimProduct {
  return {
    id: p.id,
    name: p.name,
    mainCategory: p.mainCategory,
    subCategory: p.subCategory,
    category: p.category,
    ratings: p.ratings,
    noOfRatings: p.noOfRatings,
    price: p.price,
  };
}

function buildPrompt(intent: string, candidates: Record<string, SlimProduct[]>): string {
  return [
    'You are a STRICT two-stage product relevance engine for an intent-first quick-commerce app.',
    'Your task is to process potentially noisy product labels and keep ONLY the products that are truly relevant.',
    '',
    'IMPORTANT:',
    '- The dataset may contain WRONG or MISLABELED category labels.',
    '- Category labels are hints, not truth.',
    '- You must first DROP irrelevant or mislabeled products.',
    '- Only after filtering should you rank the remaining relevant products.',
    '- Precision matters much more than recall.',
    '- Never keep a product just because it has a high rating or many reviews.',
    '',
    `User intent: """${intent}"""`,
    '',
    'Input products are grouped by requested category. Each product may contain:',
    '- name',
    '- mainCategory',
    '- subCategory',
    '- category',
    '- ratings',
    '- noOfRatings',
    '',
    'TWO-STAGE DECISION PROCESS:',
    '',
    'STAGE 1 — LABEL SANITY CHECK + RELEVANCE FILTER',
    'For each requested category, inspect every candidate product and decide:',
    'A) Is this product truly the item the user needs?',
    'B) Is the product label/category consistent with the real-world meaning?',
    'C) Is the product from the correct use-case / department?',
    '',
    'Rules for Stage 1:',
    '1. Drop products whose label is semantically wrong for the intent.',
    '2. Drop products whose category is only keyword-matching but use-case is different.',
    '3. Drop products from the wrong department.',
    '4. Drop products that are adjacent, decorative, accessory, cosmetic, or unrelated.',
    '5. If the category is noisy, trust the product name and use-case more than the label.',
    '6. If a product could belong to the category label but not to the actual intent, reject it.',
    '',
    'Examples:',
    '- If intent is food/cooking and category is turmeric:',
    '  keep: turmeric powder, turmeric whole',
    '  reject: turmeric soap, turmeric face wash, turmeric cream, turmeric shampoo',
    '- If intent is food/cooking and category is onion:',
    '  keep: fresh onion',
    '  reject: onion hair oil, onion shampoo, onion serum',
    '- If intent is food/cooking and category is banana:',
    '  keep: fresh bananas',
    '  reject: banana sipper, banana toy, banana phone',
    '',
    'STAGE 2 — HUMAN-LIKE RANKING',
    'After filtering, rank only the remaining relevant products like a human shopping assistant.',
    'Ranking priority:',
    '1. semantic relevance to the intent',
    '2. correct product type / use-case',
    '3. practical value',
    '4. ratings',
    '5. numberOfRatings',
    '6. price suitability',
    '',
    'Never let popularity rescue a wrong product.',
    'A wrong product with excellent ratings must still be rejected.',
    '',
    'FLASH MODE RULES:',
    '- Build Budget / Balanced / Premium baskets only from the filtered relevant products.',
    '- Budget = cheapest acceptable relevant product.',
    '- Balanced = best value relevant product.',
    '- Premium = highest-quality relevant product.',
    '- Do not force a category into a basket if no relevant product exists.',
    '',
    'OUTPUT RULES:',
    '- Return STRICT JSON only.',
    '- Use only ids from the input candidates.',
    '- Do not invent ids.',
    '- Do not include commentary.',
    '- Do not include explanations outside JSON.',
    '',
    'OUTPUT SHAPE:',
    '{',
    '  "quick": [',
    '    { "category": "category_key", "productIds": ["id1", "id2", "id3"] }',
    '  ],',
    '  "flash": {',
    '    "Budget": ["id1"],',
    '    "Balanced": ["id2"],',
    '    "Premium": ["id3"]',
    '  }',
    '}',
    '',
    'CATEGORY-SPECIFIC SAFETY RULE:',
    '- If the requested intent is food, cooking, grocery, or recipe-related, keep only edible or cooking-related products.',
    '- Reject personal care, cosmetic, grooming, bathing, medicine, toy, gadget, or accessory products even if the category label matches.',
    '',
    'FINAL INSTRUCTION:',
    'Think like a strict human curator.',
    'First remove all irrelevant/mislabeled items.',
    'Then rank the remaining relevant items.',
    'When in doubt, reject the product.',
    '',
    'Candidate products:',
    JSON.stringify(candidates),
  ].join('\n');
}

function isTier(x: string): x is TierName {
  return (TIER_NAMES as string[]).includes(x);
}

/** Validates the raw model output against the known candidate id set. */
function sanitize(raw: unknown, validIds: Set<string>): RankedShop | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as { quick?: unknown; flash?: unknown };

  const quick: RankedShop['quick'] = [];
  if (Array.isArray(obj.quick)) {
    for (const row of obj.quick as { category?: unknown; productIds?: unknown }[]) {
      const category = String(row?.category ?? '').trim().toLowerCase();
      if (!category) continue;
      const ids = Array.isArray(row?.productIds)
        ? (row!.productIds as unknown[])
            .map((x) => String(x))
            .filter((id) => validIds.has(id))
        : [];
      // de-dupe, preserve order
      const seen = new Set<string>();
      const deduped = ids.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
      quick.push({ category, productIds: deduped });
    }
  }

  const flash: Record<TierName, string[]> = { Budget: [], Balanced: [], Premium: [] };
  if (obj.flash && typeof obj.flash === 'object') {
    for (const [tier, ids] of Object.entries(obj.flash as Record<string, unknown>)) {
      if (!isTier(tier) || !Array.isArray(ids)) continue;
      const seen = new Set<string>();
      flash[tier] = (ids as unknown[])
        .map((x) => String(x))
        .filter((id) => validIds.has(id) && !seen.has(id) && (seen.add(id), true));
    }
  }

  if (quick.length === 0) return null;
  return { quick, flash };
}

export async function rankAndBundle(
  intent: string,
  candidatesByCategory: Record<string, Product[]>,
): Promise<RankedShop | null> {
  if (!env.geminiEnabled) return null;

  const validIds = new Set<string>();
  const slim: Record<string, SlimProduct[]> = {};
  for (const [cat, products] of Object.entries(candidatesByCategory)) {
    slim[cat] = products.map((p) => {
      validIds.add(p.id);
      return toSlim(p);
    });
  }
  if (validIds.size === 0) return null;

  try {
    const raw = await callGeminiJSON(buildPrompt(intent, slim));
    const result = sanitize(raw, validIds);
    if (!result) logger.warn('relevanceRanker: empty/invalid result, will fall back');
    return result;
  } catch (err) {
    logger.warn('relevanceRanker: Gemini failed, will fall back', {
      error: (err as Error).message,
    });
    return null;
  }
}
