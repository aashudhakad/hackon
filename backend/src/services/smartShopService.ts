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

/** Cheapest acceptable product per category (lowest positive price). */
function pickBudget(products: Product[]): Product {
  const priced = products.filter((p) => p.price > 0);
  const pool = priced.length > 0 ? priced : products;
  return pool.slice().sort((a, b) => a.price - b.price)[0];
}

/** Highest quality product per category (best rating, then most reviews). */
function pickPremium(products: Product[]): Product {
  return products
    .slice()
    .sort((a, b) => b.ratings - a.ratings || b.noOfRatings - a.noOfRatings || b.price - a.price)[0];
}

/**
 * Best-value score: quality per rupee. Ratings are weighted by review volume
 * (log-scaled so a 4.5★/10k-review product beats a 5★/2-review one) and
 * divided by price so cheaper-yet-good products rank higher.
 */
function valueScore(p: Product): number {
  const price = p.price > 0 ? p.price : 1;
  return (p.ratings * Math.log10(p.noOfRatings + 10)) / price;
}

/** Best value product per category. */
function pickBalanced(products: Product[]): Product {
  return products.slice().sort((a, b) => valueScore(b) - valueScore(a) || b.ratings - a.ratings)[0];
}

/**
 * Builds the 3 Flash tiers deterministically in the backend from the
 * Gemini-filtered, relevance-ranked products held in each Quick row's
 * `alternatives`. Gemini no longer produces flash output; it only decides
 * which products are relevant. Per category:
 *   - Budget:   cheapest acceptable product
 *   - Balanced: best value product (quality per rupee)
 *   - Premium:  highest quality product
 */
function buildTiers(rows: CategoryRow[]): Record<TierName, BasketTier> {
  const budget: Product[] = [];
  const balanced: Product[] = [];
  const premium: Product[] = [];

  for (const row of rows) {
    const pool = row.alternatives;
    if (pool.length === 0) continue;
    budget.push(pickBudget(pool));
    balanced.push(pickBalanced(pool));
    premium.push(pickPremium(pool));
  }

  return {
    Budget: { tier: 'Budget', items: budget, total: tierTotal(budget) },
    Balanced: { tier: 'Balanced', items: balanced, total: tierTotal(balanced) },
    Premium: { tier: 'Premium', items: premium, total: tierTotal(premium) },
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

  // Second Gemini pass: strict relevance filter + semantic ranking only.
  const ranked = await rankAndBundle(intent, candidatesByCat);

  const { rows, unfulfilled } = buildRows(categories, candidatesByCat, byId, ranked);
  // Flash tiers are built deterministically in the backend from the filtered rows.
  const tiers = buildTiers(rows);

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
   *   intent → categories (Gemini #1) → candidate products (indexed) →
   *   strict relevance filter + semantic ranking (Gemini #2) → Quick rows →
   *   backend-built Flash tiers (Budget/Balanced/Premium).
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
