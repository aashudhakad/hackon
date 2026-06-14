import { catalogRepository } from '../repositories/catalogRepository';
import { homepageCache } from '../repositories/homepageCache';
import { crossSellEngine } from './crossSellEngine';
import { generateCategoriesForIntent, sanitizeCategories } from './geminiClient';
import { rankAndBundle, RankedShop } from './relevanceRanker';
import {
  BasketTier,
  Bundle,
  CategoryRow,
  Product,
  RequiredComponent,
  StructuredIntent,
  TierName,
  TIER_NAMES,
} from '../types/domain';

/** Candidates fetched per category to send to the relevance ranker. */
const CANDIDATES_PER_CATEGORY = 20;
/** Max ranked alternatives shown per category row in Quick mode. */
const QUICK_MAX = 10;

export interface SmartShopResult {
  categories: string[];
  rows: CategoryRow[];
  tiers: Record<TierName, BasketTier>;
  crossSell: Product[];
  unfulfilledComponents: string[];
  cached: boolean;
}

function tierTotal(items: Product[]): number {
  return items.reduce((acc, p) => acc + p.price, 0);
}

/** Deterministic per-category ranking fallback (ratings/popularity order). */
function deterministicRanked(products: Product[]): Product[] {
  return products
    .slice()
    .sort((a, b) => b.ratings - a.ratings || b.noOfRatings - a.noOfRatings || a.price - b.price);
}

/** Builds Quick rows from LLM relevance output (or deterministic fallback). */
function buildRows(
  categories: string[],
  candidatesByCat: Record<string, Product[]>,
  byId: Map<string, Product>,
  ranked: RankedShop | null,
): { rows: CategoryRow[]; unfulfilled: string[] } {
  const rows: CategoryRow[] = [];
  const unfulfilled: string[] = [];

  categories.forEach((category, i) => {
    const candidates = candidatesByCat[category] ?? [];
    let ordered: Product[];

    const llmRow = ranked?.quick.find((r) => r.category === category);
    if (ranked && llmRow) {
      // Trust LLM relevance: use exactly the ids it kept, in its order.
      ordered = llmRow.productIds.map((id) => byId.get(id)).filter((p): p is Product => !!p);
    } else {
      // No LLM result for this category → deterministic ranking of candidates.
      ordered = deterministicRanked(candidates);
    }

    const alternatives = ordered.slice(0, QUICK_MAX);
    const component: RequiredComponent = { name: category, sequence: i, themes: [category] };

    if (alternatives.length === 0) {
      unfulfilled.push(category);
      rows.push({ component, alternatives: [], selectedItemId: null, state: 'empty' });
    } else {
      rows.push({
        component,
        alternatives,
        selectedItemId: alternatives[0].id,
        state: 'normal',
      });
    }
  });

  return { rows, unfulfilled };
}

/** Builds the 3 Flash tiers from LLM output, falling back to row-based tiers. */
function buildTiers(
  rows: CategoryRow[],
  byId: Map<string, Product>,
  ranked: RankedShop | null,
): Record<TierName, BasketTier> {
  let baskets: { items: Product[] }[] = [];

  const llmHasFlash =
    ranked && TIER_NAMES.some((t) => (ranked.flash[t] ?? []).length > 0);

  if (llmHasFlash && ranked) {
    baskets = TIER_NAMES.map((t) => ({
      items: (ranked.flash[t] ?? []).map((id) => byId.get(id)).filter((p): p is Product => !!p),
    }));
  } else {
    // Fallback: per category pick cheapest / median / dearest from its relevant set.
    const budget: Product[] = [];
    const balanced: Product[] = [];
    const premium: Product[] = [];
    for (const row of rows) {
      if (row.alternatives.length === 0) continue;
      const byPrice = row.alternatives.slice().sort((a, b) => a.price - b.price);
      budget.push(byPrice[0]);
      balanced.push(byPrice[Math.floor((byPrice.length - 1) / 2)]);
      premium.push(byPrice[byPrice.length - 1]);
    }
    baskets = [{ items: budget }, { items: balanced }, { items: premium }];
  }

  // Enforce Budget <= Balanced <= Premium by total (relabel by ascending total).
  const sorted = baskets
    .map((b) => ({ items: b.items, total: tierTotal(b.items) }))
    .sort((a, b) => a.total - b.total);

  return {
    Budget: { tier: 'Budget', items: sorted[0].items, total: sorted[0].total },
    Balanced: { tier: 'Balanced', items: sorted[1].items, total: sorted[1].total },
    Premium: { tier: 'Premium', items: sorted[2].items, total: sorted[2].total },
  };
}

async function compute(intent: string, categories: string[]): Promise<SmartShopResult> {
  // Fetch candidate products per category (indexed query, best-by-rating first).
  const catalog = await catalogRepository.getProductsByCategories(categories, CANDIDATES_PER_CATEGORY);

  const candidatesByCat: Record<string, Product[]> = {};
  const byId = new Map<string, Product>();
  for (const cat of categories) candidatesByCat[cat] = [];
  for (const p of catalog.products) {
    byId.set(p.id, p);
    const key = p.component.trim().toLowerCase();
    (candidatesByCat[key] ??= []).push(p);
  }

  // Second Gemini pass: relevance filter + ranking + smart bundles.
  const ranked = await rankAndBundle(intent, candidatesByCat);

  const { rows, unfulfilled } = buildRows(categories, candidatesByCat, byId, ranked);
  const tiers = buildTiers(rows, byId, ranked);

  // Cross-sell from the candidate pool, excluding selected items.
  const structured: StructuredIntent = {
    rawText: intent || categories.join(', '),
    components: rows.map((r) => r.component),
  };
  const fulfilled = rows.filter((r) => r.selectedItemId).length;
  const bundle: Bundle = {
    intent: structured,
    rows,
    tiers,
    confidence: categories.length ? Math.round((fulfilled / categories.length) * 100) : 0,
    unfulfilledComponents: unfulfilled,
    explanation: null,
    lowConfidence: false,
  };
  const crossSell = crossSellEngine.select(bundle, { products: catalog.products });

  return { categories, rows, tiers, crossSell, unfulfilledComponents: unfulfilled, cached: false };
}

export const smartShopService = {
  /**
   * Full smart-shop flow for a text intent:
   *   intent → categories (Gemini) → candidate products (indexed) →
   *   relevance + ranking + bundles (Gemini) → Quick rows + Flash tiers.
   * Cached by normalized intent so refreshes/repeats are instant.
   */
  async shop(params: { intent?: string; categories?: string[] }): Promise<SmartShopResult> {
    const categories =
      params.categories && params.categories.length > 0
        ? sanitizeCategories(params.categories)
        : await generateCategoriesForIntent(params.intent ?? '');

    if (categories.length === 0) {
      return {
        categories: [],
        rows: [],
        tiers: {
          Budget: { tier: 'Budget', items: [], total: 0 },
          Balanced: { tier: 'Balanced', items: [], total: 0 },
          Premium: { tier: 'Premium', items: [], total: 0 },
        },
        crossSell: [],
        unfulfilledComponents: [],
        cached: false,
      };
    }

    const cacheKey = `shop:${(params.intent ?? categories.join(',')).trim().toLowerCase()}`;
    const cached = await homepageCache.get<SmartShopResult>(cacheKey);
    if (cached) return { ...cached, cached: true };

    const result = await compute(params.intent ?? categories.join(', '), categories);
    await homepageCache.set(cacheKey, result, 60 * 60);
    return result;
  },
};
