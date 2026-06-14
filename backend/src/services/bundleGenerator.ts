import {
  BasketTier,
  Bundle,
  Catalog,
  CategoryRow,
  Product,
  RequiredComponent,
  StructuredIntent,
  TierName,
} from '../types/domain';
import { confidenceEngine } from './confidenceEngine';
import { buildExplanation, isLowConfidence } from './explanationService';
import { BundleGenerator } from './interfaces';
import { rankingEngine } from './rankingEngine';

/** Maximum alternatives per Brand_Swiper (Requirement 4.2, Property 10). */
export const MAX_ALTERNATIVES = 50;

function sumPrices(items: Product[]): number {
  return items.reduce((acc, p) => acc + p.price, 0);
}

/**
 * Builds the three Basket_Tiers from in-stock products grouped by component.
 *
 * Monotonicity (Property 22, Requirement 8.5) is guaranteed structurally: for
 * each component we sort in-stock products by ascending price and pick the
 * cheapest for Budget, the dearest for Premium, and the middle item for
 * Balanced. Since per-component Budget.price <= Balanced.price <= Premium.price,
 * the summed totals satisfy Budget <= Balanced <= Premium.
 */
function buildTiers(
  components: RequiredComponent[],
  inStockByComponent: Map<string, Product[]>,
): Record<TierName, BasketTier> {
  const budget: Product[] = [];
  const balanced: Product[] = [];
  const premium: Product[] = [];

  for (const component of components) {
    const products = inStockByComponent.get(component.name) ?? [];
    if (products.length === 0) continue;

    const byPrice = products.slice().sort((a, b) => a.price - b.price || (a.id < b.id ? -1 : 1));
    const cheapest = byPrice[0];
    const dearest = byPrice[byPrice.length - 1];
    const middle = byPrice[Math.floor((byPrice.length - 1) / 2)];

    budget.push(cheapest);
    balanced.push(middle);
    premium.push(dearest);
  }

  const make = (tier: TierName, items: Product[]): BasketTier => ({
    tier,
    items,
    total: sumPrices(items),
  });

  return {
    Budget: make('Budget', budget),
    Balanced: make('Balanced', balanced),
    Premium: make('Premium', premium),
  };
}

export const bundleGenerator: BundleGenerator = {
  generate(intent: StructuredIntent, catalog: Catalog): Bundle {
    // Preserve the intent's defined component sequence (Property 9).
    const components = intent.components.slice().sort((a, b) => a.sequence - b.sequence);

    const rows: CategoryRow[] = [];
    const unfulfilledComponents: string[] = [];
    const inStockByComponent = new Map<string, Product[]>();

    for (const component of components) {
      const ranked = rankingEngine.rankAlternatives(component, catalog.products);
      const availableRanked = ranked.filter((p) => p.availability === 'in-stock');
      const alternatives = availableRanked.slice(0, MAX_ALTERNATIVES);
      const defaultItem = rankingEngine.pickDefault(ranked);

      if (defaultItem) {
        inStockByComponent.set(component.name, availableRanked);
      } else {
        unfulfilledComponents.push(component.name);
      }

      rows.push({
        component,
        alternatives,
        selectedItemId: defaultItem ? defaultItem.id : null,
        state: alternatives.length === 0 ? 'empty' : 'normal',
      });
    }

    const tiers = buildTiers(components, inStockByComponent);

    const confidence = confidenceEngine.score(intent, { rows, unfulfilledComponents });
    const explanation = buildExplanation(rows, confidence);

    return {
      intent,
      rows,
      tiers,
      confidence,
      unfulfilledComponents,
      explanation,
      lowConfidence: isLowConfidence(confidence),
    };
  },
};

/**
 * Unavailable-item substitution (Task 5.8).
 *
 * Property 26 (Requirements 11.2, 11.5): when a row's Selected_Item becomes
 * unavailable, replace it with the highest-ranked still-available alternative
 * in the same component; if none exist, mark the row unavailable and clear the
 * selection so its price is excluded from totals.
 *
 * Returns a new CategoryRow; the input is not mutated.
 */
export function substituteUnavailable(row: CategoryRow, catalog: Catalog): CategoryRow {
  const ranked = rankingEngine.rankAlternatives(row.component, catalog.products);
  const available = ranked.filter((p) => p.availability === 'in-stock');

  const current = available.find((p) => p.id === row.selectedItemId);
  if (current) {
    // Still available — nothing to substitute.
    return { ...row, alternatives: available.slice(0, MAX_ALTERNATIVES) };
  }

  const replacement = rankingEngine.pickDefault(ranked);
  if (replacement) {
    return {
      ...row,
      alternatives: available.slice(0, MAX_ALTERNATIVES),
      selectedItemId: replacement.id,
      state: 'substituted',
    };
  }

  return {
    ...row,
    alternatives: [],
    selectedItemId: null,
    state: 'unavailable',
  };
}
