import { BasketTier, CartSummary, Product } from '../types/domain';

/**
 * Cart total computation and mutation helpers (Task 7.3).
 *
 * Property 13 (Requirements 4.7, 5.3, 11.5, 12.2): the total equals the sum of
 * the prices of the currently selected available items (excluding unavailable
 * components) and is always >= 0.
 * Property 14 (Requirement 5.4): selecting a tier sets the cart's items/total
 * to that tier's items/total.
 * Property 16 (Requirement 6.6): adding a cross-sell product increases the
 * total by exactly that product's price.
 */

/** Computes a Cart_Summary total over available items only, clamped to >= 0. */
export function computeTotal(items: Product[]): number {
  const total = items
    .filter((p) => p.availability === 'in-stock')
    .reduce((acc, p) => acc + p.price, 0);
  return Math.max(0, total);
}

/** Builds a Cart_Summary from a list of items. */
export function buildCartSummary(items: Product[], currency: string): CartSummary {
  const available = items.filter((p) => p.availability === 'in-stock');
  return {
    items: available,
    total: computeTotal(available),
    currency,
  };
}

/** Sets the cart to a chosen Basket_Tier (Requirement 5.4). */
export function selectTier(tier: BasketTier, currency: string): CartSummary {
  return buildCartSummary(tier.items, currency);
}

/** Adds a cross-sell product, increasing the total by its price (Requirement 6.6). */
export function addProduct(cart: CartSummary, product: Product): CartSummary {
  const items = [...cart.items, product];
  return {
    items,
    total: computeTotal(items),
    currency: cart.currency,
  };
}

/** True when the cart has no available items (gates checkout, Requirement 12.3). */
export function isCartEmpty(cart: CartSummary): boolean {
  return cart.items.filter((p) => p.availability === 'in-stock').length === 0;
}
