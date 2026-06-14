import { Product, RawProduct } from '../types/domain';

/**
 * Derives the engine's working fields (component, price, rank, themes, brand)
 * from the raw CSV columns. This is the single source of truth for that
 * mapping, used both by the catalog repository (on read) and the sample seed.
 */

const CURRENCY = 'INR';

/** Rank: ratings dominate, number-of-ratings breaks ties. */
export function deriveRank(ratings: number, noOfRatings: number): number {
  const r = Number.isFinite(ratings) ? ratings : 0;
  const n = Number.isFinite(noOfRatings) ? noOfRatings : 0;
  return Math.round(r * 1_000_000 + Math.min(n, 999_999));
}

/** Best-effort brand from the first token of the product name. */
export function deriveBrand(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  return first.replace(/[^\p{L}\p{N}'&-]/gu, '') || 'Generic';
}

function deriveThemes(raw: Pick<RawProduct, 'mainCategory' | 'subCategory' | 'category'>): string[] {
  const themes = [raw.mainCategory, raw.subCategory, raw.category]
    .map((t) => (t ?? '').toString().trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(themes));
}

export function normalizeProduct(raw: RawProduct): Product {
  const price = raw.discountPrice > 0 ? raw.discountPrice : raw.actualPrice;
  return {
    ...raw,
    brand: deriveBrand(raw.name),
    component: raw.category,
    price: Math.max(0, price),
    currency: CURRENCY,
    rank: deriveRank(raw.ratings, raw.noOfRatings),
    themes: deriveThemes(raw),
  };
}
