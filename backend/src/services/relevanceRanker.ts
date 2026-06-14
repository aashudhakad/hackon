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
  ratings: number;
  noOfRatings: number;
  price: number;
}

function toSlim(p: Product): SlimProduct {
  return {
    id: p.id,
    name: p.name,
    ratings: p.ratings,
    noOfRatings: p.noOfRatings,
    price: p.price,
  };
}

function buildPrompt(intent: string, candidates: Record<string, SlimProduct[]>): string {
  return [
    'You are a product RELEVANCE and RANKING engine for a quick-commerce app.',
    `User intent: """${intent}"""`,
    '',
    'Below is a JSON object mapping each required category to its candidate products',
    '(id, name, ratings 0-5, noOfRatings, price in INR):',
    JSON.stringify(candidates),
    '',
    'Do ALL of the following:',
    '1. RELEVANCE FILTER — For each category, KEEP only products that are genuinely',
    '   the item the category/intent means. REMOVE mislabelled or unrelated items.',
    '   Example: under "banana", keep actual bananas; REMOVE "banana sipper",',
    '   "banana shaped toy", "banana phone". Do NOT keep accessories/toys/gadgets',
    '   when the user clearly wants the food/grocery item.',
    '2. RANK the kept products best-first using a smart blend of quality (ratings),',
    '   popularity (noOfRatings) and sensible price. Higher real value first.',
    '3. BUILD three bundles by choosing exactly ONE relevant product per category',
    '   for each tier: "Budget" (cheapest good option), "Balanced" (best value),',
    '   "Premium" (top quality). Skip a category in a tier only if it has no',
    '   relevant product.',
    '',
    'Respond with STRICT JSON, ids only, no commentary:',
    '{',
    '  "quick": [ { "category": "banana", "productIds": ["id1","id2"] } ],',
    '  "flash": { "Budget": ["idA"], "Balanced": ["idB"], "Premium": ["idC"] }',
    '}',
    'Rules: use ONLY ids that appear in the candidates. Never invent ids.',
    'If a category has no relevant product, omit it (empty productIds).',
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
