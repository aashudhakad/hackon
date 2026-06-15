'use client';

import { Zap, ShoppingBag, Trash2 } from 'lucide-react'; // ✅ ADDED Trash2 Icon
import { BasketTier, CartLine, Product, TierName, TIER_NAMES } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { ProductCard } from './ProductCard';

interface TierBasketsProps {
  tiers: Record<TierName, BasketTier>;
  activeTier: TierName;
  cart: CartLine[];
  onSelectTier: (tier: TierName) => void;
  onAdd: (product: Product) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void; // ✅ ADDED
}

export function TierBaskets({
  tiers,
  activeTier,
  cart,
  onSelectTier,
  onAdd,
  onIncrement,
  onDecrement,
  onRemove, // ✅ ADDED
}: TierBasketsProps) {
  const tier = tiers[activeTier];
  const items = tier?.items ?? [];
  const currency = items[0]?.currency ?? 'INR';

  const getQuantity = (productId: string): number =>
    cart.find((line) => line.product.id === productId)?.quantity ?? 0;

  const cartTotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  // Check how many items from this specific bundle are currently in the cart
  const itemsInCartCount = items.filter((p) => getQuantity(p.id) > 0).length;

  const handleAddFullBundle = () => {
    items.forEach((product) => {
      if (getQuantity(product.id) === 0) {
        onAdd(product);
      }
    });
  };

  const handleRemoveFullBundle = () => {
    items.forEach((product) => {
      if (getQuantity(product.id) > 0) {
        onRemove(product.id);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-flash-200 bg-white p-3 shadow-card sm:p-4">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="flash-bolt h-5 w-5 text-flash-600" fill="currentColor" />
          <h2 className="text-sm font-bold text-gray-900 sm:text-base">
            Mix & Match or Grab a Bundle
          </h2>
        </div>
        
        {/* ✅ DYNAMIC BUTTONS AREA */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Show "Remove Bundle" ONLY if at least one item from this bundle is in cart */}
          {itemsInCartCount > 0 && (
            <button
              onClick={handleRemoveFullBundle}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
            >
              <Trash2 size={14} />
              Clear Bundle
            </button>
          )}

          {/* Show "Add Bundle" ONLY if there are missing items from this bundle */}
          {items.length > 0 && itemsInCartCount < items.length && (
            <button
              onClick={handleAddFullBundle}
              className="flex items-center gap-1.5 rounded-lg bg-flash-50 px-3 py-1.5 text-xs font-semibold text-flash-600 transition hover:bg-flash-100"
            >
              <ShoppingBag size={14} />
              Add Missing
            </button>
          )}
        </div>
      </div>

      {/* Tier selector */}
      <div className="grid grid-cols-3 gap-2">
        {TIER_NAMES.map((name) => {
          const isActive = name === activeTier;
          const total = tiers[name]?.total ?? 0;
          const cur = tiers[name]?.items[0]?.currency ?? 'INR';
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelectTier(name)}
              className={`flex min-h-12 flex-col items-center justify-center rounded-xl border-2 p-2 text-center transition ${
                isActive
                  ? 'border-flash-600 bg-flash-600 text-white shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-flash-300'
              }`}
            >
              <span className="text-xs font-bold sm:text-sm">{name}</span>
              <span className={`mt-0.5 text-[10px] sm:text-xs ${isActive ? 'text-flash-50' : 'text-gray-500'}`}>
                {formatPrice(total, cur)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Items */}
      <ul className="mt-4 space-y-2">
        {items.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            quantity={getQuantity(p.id)}
            onAdd={onAdd}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            layout="row"
            tone="flash"
          />
        ))}
        {items.length === 0 && (
          <li className="py-4 text-center text-sm text-gray-500">No items available for this basket.</li>
        )}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-sm font-semibold text-gray-700">Custom Cart Total</span>
        <span className="text-lg font-bold text-flash-600">{formatPrice(cartTotal, currency)}</span>
      </div>
    </section>
  );
}