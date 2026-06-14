import { Bundle, Catalog, Product } from '../types/domain';
import { CrossSellEngine } from './interfaces';

/**
 * Contextual cross-sell selection (Task 7.1).
 *
 * Property 15 (Requirements 6.2, 6.3, 6.4): returns [] when no catalog product
 * shares a theme with the bundle; otherwise returns 3..4 products that each
 * share at least one theme attribute with the bundle and are not already part
 * of the bundle.
 */
const MIN_CROSS_SELL = 3;
const MAX_CROSS_SELL = 4;

/** Collects the distinct theme set across all products selected in the bundle. */
function bundleThemes(bundle: Bundle): Set<string> {
  const themes = new Set<string>();
  for (const component of bundle.intent.components) {
    for (const theme of component.themes) themes.add(theme);
  }
  for (const row of bundle.rows) {
    const selected = row.alternatives.find((p) => p.id === row.selectedItemId);
    if (selected) for (const theme of selected.themes) themes.add(theme);
  }
  return themes;
}

/** Ids of every product currently part of the bundle (any tier or selection). */
function bundleProductIds(bundle: Bundle): Set<string> {
  const ids = new Set<string>();
  for (const row of bundle.rows) {
    if (row.selectedItemId) ids.add(row.selectedItemId);
  }
  for (const tier of Object.values(bundle.tiers)) {
    for (const item of tier.items) ids.add(item.id);
  }
  return ids;
}

export const crossSellEngine: CrossSellEngine = {
  select(bundle: Bundle, catalog: Catalog): Product[] {
    const themes = bundleThemes(bundle);
    const excluded = bundleProductIds(bundle);

    const candidates = catalog.products
      .filter((p) => p.availability === 'in-stock')
      .filter((p) => !excluded.has(p.id))
      .filter((p) => p.themes.some((t) => themes.has(t)))
      // Rank desc, id asc tiebreak for deterministic output.
      .sort((a, b) => b.rank - a.rank || (a.id < b.id ? -1 : 1));

    if (candidates.length === 0) return [];

    // Clamp to 3..4; if only 1-2 share a theme we still cannot meet the minimum
    // of 3, in which case the strip is hidden (return []).
    if (candidates.length < MIN_CROSS_SELL) return [];

    return candidates.slice(0, MAX_CROSS_SELL);
  },
};
