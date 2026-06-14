'use client';

import { CartLine, Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { ProductImage } from './ProductImage';

interface CrossSellStripProps {
  products: Product[];
  cart: CartLine[];
  onAdd: (product: Product) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
}

/**
 * Cross_Sell_Strip - Shows thematic products with quantity controls.
 * Only adds/removes when clicking +/- buttons, not on card click.
 */
export function CrossSellStrip({ products, cart, onAdd, onIncrement, onDecrement }: CrossSellStripProps) {
  if (products.length === 0) return null;

  const getQuantity = (productId: string): number => {
    return cart.find((line) => line.product.id === productId)?.quantity ?? 0;
  };

  return (
    <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        You might also need
      </p>
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
        {products.map((p) => {
          const quantity = getQuantity(p.id);
          const inCart = quantity > 0;

          return (
            <div
              key={p.id}
              className={`flex w-32 sm:w-36 shrink-0 flex-col rounded-xl border-2 p-2 transition ${
                inCart ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex h-16 sm:h-20 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                <ProductImage
                  src={p.image}
                  alt={p.name}
                  category={p.component}
                  brand={p.brand}
                  className="h-full w-full object-contain"
                />
              </div>
              
              <span className="mt-1.5 line-clamp-2 text-xs font-medium text-gray-800 leading-tight">
                {p.name}
              </span>
              
              <span className="mt-1 text-xs sm:text-sm font-semibold text-gray-900">
                {formatPrice(p.price, p.currency)}
              </span>

              {/* Quantity Controls */}
              {inCart ? (
                <div className="mt-2 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDecrement(p.id);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100 active:scale-95"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  
                  <span className="flex-1 text-center text-xs font-bold text-gray-900">
                    {quantity}
                  </span>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onIncrement(p.id);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-lg border transition active:scale-95"
                    style={{ 
                      borderColor: 'var(--accent)', 
                      background: 'var(--accent)', 
                      color: 'var(--accent-fg)' 
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(p);
                  }}
                  className="mt-2 rounded-lg px-2 py-1 text-xs font-medium transition active:scale-95"
                  style={{ border: '1px solid var(--accent)', color: 'var(--accent)' }}
                >
                  + Add
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
