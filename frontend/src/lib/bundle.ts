import { Bundle, CartLine, CategoryRow, Product, SmartBundle } from './types';

/** Adds a product to the cart (increments quantity if already present). */
export function addLine(lines: CartLine[], product: Product, qty = 1): CartLine[] {
  const existing = lines.find((l) => l.product.id === product.id);
  if (existing) {
    return lines.map((l) =>
      l.product.id === product.id ? { ...l, quantity: l.quantity + qty } : l,
    );
  }
  return [...lines, { product, quantity: qty }];
}

/** Adds many products at once (e.g. a whole tier basket). */
export function addManyLines(lines: CartLine[], products: Product[]): CartLine[] {
  return products.reduce((acc, p) => addLine(acc, p), lines);
}

export function incLine(lines: CartLine[], productId: string): CartLine[] {
  return lines.map((l) => (l.product.id === productId ? { ...l, quantity: l.quantity + 1 } : l));
}

/** Decrements quantity, removing the line when it reaches zero. */
export function decLine(lines: CartLine[], productId: string): CartLine[] {
  return lines
    .map((l) => (l.product.id === productId ? { ...l, quantity: l.quantity - 1 } : l))
    .filter((l) => l.quantity > 0);
}

export function removeLine(lines: CartLine[], productId: string): CartLine[] {
  return lines.filter((l) => l.product.id !== productId);
}

/**
 * Quick mode selection: makes `product` the single chosen item for its category
 * (replaces any other line from the same component), quantity preserved at >=1.
 */
export function selectInCategory(lines: CartLine[], product: Product): CartLine[] {
  const withoutCategory = lines.filter((l) => l.product.component !== product.component);
  return [...withoutCategory, { product, quantity: 1 }];
}

/** Removes whichever product is currently selected for a given category. */
export function clearCategory(lines: CartLine[], component: string): CartLine[] {
  return lines.filter((l) => l.product.component !== component);
}

/** The product id currently selected for a category, or null. */
export function selectedIdForCategory(lines: CartLine[], component: string): string | null {
  return lines.find((l) => l.product.component === component)?.product.id ?? null;
}

/** Builds cart lines (qty 1) from a list of products — used by Flash tier select. */
export function linesFromProducts(products: Product[]): CartLine[] {
  return products.map((product) => ({ product, quantity: 1 }));
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce(
    (acc, l) => acc + (l.product.availability === 'in-stock' ? l.product.price * l.quantity : 0),
    0,
  );
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + l.quantity, 0);
}

/** Map of productId -> quantity, for showing badges on product cards. */
export function quantitiesMap(lines: CartLine[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const l of lines) map[l.product.id] = l.quantity;
  return map;
}

/** Flattens cart lines into the checkout payload (product + quantity). */
export function toCheckoutItems(lines: CartLine[]): Array<Product & { quantity: number }> {
  return lines.map((l) => ({ ...l.product, quantity: l.quantity }));
}

/**
 * Converts a pre-assembled Smart Bundle into the shared Bundle shape so it can
 * render in the same shopping screen, seeding rows from the Balanced tier.
 */
export function smartBundleToBundle(sb: SmartBundle): Bundle {
  const balanced = sb.preassembled.Balanced?.items ?? [];

  const rows: CategoryRow[] = balanced.map((item, index) => ({
    component: { name: item.component, sequence: index, themes: item.themes },
    alternatives: collectAlternatives(sb, item.component),
    selectedItemId: item.id,
    state: 'normal',
  }));

  return {
    intent: { rawText: sb.label, components: rows.map((r) => r.component) },
    rows,
    tiers: sb.preassembled,
    confidence: 100,
    unfulfilledComponents: [],
    explanation: `Pre-assembled basket for "${sb.label}".`,
    lowConfidence: false,
  };
}

function collectAlternatives(sb: SmartBundle, component: string): Product[] {
  const seen = new Map<string, Product>();
  for (const tier of Object.values(sb.preassembled)) {
    for (const item of tier.items) {
      if (item.component === component && !seen.has(item.id)) seen.set(item.id, item);
    }
  }
  return Array.from(seen.values()).sort((a, b) => b.rank - a.rank);
}
