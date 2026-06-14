import { logger } from '../config/logger';
import { env } from '../config/env';
import { callGeminiJSON } from './geminiClient';
import { Product } from '../types/domain';

/**
 * Second Gemini pass: RELEVANCE + RANKING.
 *
 * Given the user intent and the candidate products fetched per category
 * (slimmed to id/name/category/mainCategory/subCategory), Gemini:
 * 1. Drops products that are not genuinely the item implied by the category
 * (e.g. removes "banana sipper"/"banana phone toy" from "banana").
 * 2. Ranks the remaining relevant products based purely on semantic relevance.
 *
 * (Flash tier generation and final rating/price-based scoring happens in the backend)
 * * Returns null on any failure so the caller can fall back to deterministic handling.
 */

export interface RankedShop {
  quick: { category: string; productIds: string[] }[];
}

interface SlimProduct {
  id: string;
  name: string;
  mainCategory: string;
  subCategory: string;
  category: string;
}

function toSlim(p: Product): SlimProduct {
  return {
    id: p.id,
    name: p.name,
    mainCategory: p.mainCategory,
    subCategory: p.subCategory,
    category: p.category,
  };
}

function buildPrompt(intent: string, candidates: Record<string, SlimProduct[]>): string {
  return [
    'You are a STRICT product relevance engine.',
    '',
    'Your ONLY responsibility is:',
    '1. Remove irrelevant products.',
    '2. Remove mislabeled products.',
    '3. Rank remaining products by semantic relevance.',
    '',
    'IMPORTANT:',
    '- Category labels may be wrong.',
    '- MainCategory may be wrong.',
    '- SubCategory may be wrong.',
    '- Product name is the strongest signal.',
    '- Use common sense.',
    '- Precision is MUCH more important than recall.',
    '- If unsure, reject the product.',
    '',
    `USER INTENT: """${intent}"""`,
    '',
    'INPUT:',
    '- Products are grouped by categories generated in a previous step.',
    '- Some products may be incorrectly categorized.',
    '- Some products may contain matching keywords but belong to completely different domains.',
    '',
    'STAGE 1: STRICT RELEVANCE FILTER',
    '',
    'For EVERY candidate product ask:',
    '',
    '1. Is this genuinely the item a human would buy for this intent?',
    '2. Is this product from the correct real-world use case?',
    '3. Is this product useful for achieving the user goal?',
    '',
    'REJECT products that:',
    '- Match only by keyword.',
    '- Belong to another department.',
    '- Are accessories.',
    '- Are decorative items.',
    '- Are cosmetics when food is expected.',
    '- Are food when cosmetics are expected.',
    '- Are toys, gadgets, novelty items.',
    '- Are adjacent but not actually needed.',
    '',
    'EXAMPLES:',
    '',
    'Intent: Make Paneer Bhurji',
    'Category: Onion',
    'KEEP: Fresh onion',
    'REJECT: Onion hair oil, onion shampoo, onion serum',
    '',
    'Intent: Cooking',
    'Category: Turmeric',
    'KEEP: Turmeric powder, whole turmeric',
    'REJECT: Turmeric soap, turmeric face wash, turmeric cream',
    '',
    'Intent: Banana smoothie',
    'Category: Banana',
    'KEEP: Fresh bananas',
    'REJECT: Banana toy, banana bottle, banana phone',
    '',
    'Intent: Movie night',
    'KEEP: Chips, popcorn, soft drinks, chocolates',
    'REJECT: TV stand, projector mount, movie posters',
    '',
    'Intent: Gym starter kit',
    'KEEP: Protein powder, shaker, resistance bands',
    'REJECT: Random snacks, unrelated supplements',
    '',
    'VERY IMPORTANT:',
    'A highly rated irrelevant product must still be rejected.',
    'Popularity NEVER overrides relevance.',
    '',
    'STAGE 2: HUMAN-LIKE RANKING',
    '',
    'After filtering, rank products within each category.',
    '',
    'Ranking Priority:',
    '1. Semantic relevance',
    '2. Correct use case',
    '3. Human common sense',
    '',
    'CATEGORY PRESERVATION:',
    '- Never remove an entire category unless every product is irrelevant.',
    '- Keep only the strongest products.',
    '- Prefer 3-8 products per category.',
    '',
    'OUTPUT:',
    '',
    'Return ONLY JSON.',
    '',
    '{',
    '  "quick": [',
    '    {',
    '      "category": "category_name",',
    '      "productIds": ["id1","id2","id3"]',
    '    }',
    '  ]',
    '}',
    '',
    'DO NOT:',
    '- Return flash tiers.',
    '- Return explanations.',
    '- Return markdown.',
    '- Return text.',
    '- Return invalid ids.',
    '',
    'Think like an extremely strict human shopping curator.',
    '',
    'CANDIDATE PRODUCTS:',
    JSON.stringify(candidates)
  ].join('\n');
}

/** Validates the raw model output against the known candidate id set. */
function sanitize(raw: unknown, validIds: Set<string>): RankedShop | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as { quick?: unknown };

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
      
      // Only push category if it still has relevant products left
      if (deduped.length > 0) {
        quick.push({ category, productIds: deduped });
      }
    }
  }

  if (quick.length === 0) return null;
  return { quick };
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