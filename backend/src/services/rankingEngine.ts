import { Product, RequiredComponent } from '../types/domain';
import { RankingEngine } from './interfaces';

/**
 * Ranking and default selection (Task 3.1).
 *
 * Property 20 (Requirements 8.2, 4.5): alternatives are ordered by descending
 * rank, and the default Selected_Item is the highest-ranked in-stock product
 * (equivalently, the first in-stock item in the sorted list), or null.
 */
export const rankingEngine: RankingEngine = {
  rankAlternatives(component: RequiredComponent, products: Product[]): Product[] {
    const target = component.name.trim().toLowerCase();
    return products
      .filter((p) => p.component.trim().toLowerCase() === target)
      // Stable, deterministic sort: rank desc, then id asc to break ties.
      .slice()
      .sort((a, b) => (b.rank - a.rank) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  },

  pickDefault(ranked: Product[]): Product | null {
    for (const product of ranked) {
      if (product.availability === 'in-stock') return product;
    }
    return null;
  },
};
