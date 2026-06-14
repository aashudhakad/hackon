'use client';

import { BasketTier, CartLine, Product, TierName, TIER_NAMES } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { BoltIcon } from './icons';
import { ProductImage } from './ProductImage';

interface TierBasketsProps {
  tiers: Record<TierName, BasketTier>;
  activeTier: TierName;
  cart: CartLine[];
  onSelectTier: (tier: TierName) => void;
  onAdd: (product: Product) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
}

/**
 * Flash mode Super-Quick 3-tier baskets with quantity controls.
 * Users can now adjust quantities and add multiple items from each tier.
 */
export function TierBaskets({ 
  tiers, 
  activeTier, 
  cart,
  onSelectTier,
  onAdd,
  onIncrement,
  onDecrement 
}: TierBasketsProps) {
  const tier = tiers[activeTier];
  const items = tier?.items ?? [];
  const currency = items[0]?.currency ?? 'INR';

  const getQuantity = (productId: string): number => {
    return cart.find((line) => line.product.id === productId)?.quantity ?? 0;
  };

  return (
    <section className="rounded-xl sm:rounded-2xl border-2 border-red-200 bg-white p-3 sm:p-4">
      <div className="mb-2 sm:mb-3 flex items-center gap-2">
        <BoltIcon className="flash-bolt h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
        <h2 className="text-sm sm:text-base font-bold text-gray-900">Flash baskets — pick a tier and customize</h2>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {TIER_NAMES.map((name) => {
          const isActive = name === activeTier;
          const total = tiers[name]?.total ?? 0;
          const cur = tiers[name]?.items[0]?.currency ?? 'INR';
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelectTier(name)}
              className={`rounded-lg sm:rounded-xl border-2 p-2 sm:p-3 text-center transition ${
                isActive
                  ? 'border-red-600 bg-red-600 text-white shadow-lg'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-red-300'
              }`}
            >
              <span className="block text-xs sm:text-sm font-bold">{name}</span>
              <span className={`mt-0.5 block text-[10px] sm:text-xs ${isActive ? 'text-red-50' : 'text-gray-500'}`}>
                {formatPrice(total, cur)}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="mt-3 sm:mt-4 space-y-2">
        {items.map((p) => {
          const quantity = getQuantity(p.id);
          const inCart = quantity > 0;
          
          return (
            <li
              key={p.id}
              className={`flex items-center gap-2 sm:gap-3 rounded-lg border-2 px-2 sm:px-3 py-2 transition ${
                inCart ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-50">
                <ProductImage
                  src={p.image}
                  alt={p.name}
                  category={p.component}
                  brand={p.brand}
                  className="h-full w-full object-contain"
                />
              </div>
              
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs sm:text-sm font-medium text-gray-800">{p.name}</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900">{formatPrice(p.price, p.currency)}</span>
              </div>
              
              {/* Quantity Controls */}
              {inCart ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => onDecrement(p.id)}
                    className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100 active:scale-95"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  
                  <span className="w-5 sm:w-6 text-center text-xs sm:text-sm font-bold text-gray-900">
                    {quantity}
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => onIncrement(p.id)}
                    className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg border border-red-600 bg-red-600 text-white transition hover:bg-red-700 active:scale-95"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onAdd(p)}
                  className="rounded-lg border border-red-600 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium text-red-600 transition hover:bg-red-50 active:scale-95 whitespace-nowrap"
                >
                  Add
                </button>
              )}
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="py-4 text-center text-xs sm:text-sm text-gray-500">No items available for this basket.</li>
        )}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-xs sm:text-sm font-semibold text-gray-700">Cart total</span>
        <span className="text-base sm:text-lg font-bold text-red-600">
          {formatPrice(
            cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
            currency
          )}
        </span>
      </div>
    </section>
  );
}
