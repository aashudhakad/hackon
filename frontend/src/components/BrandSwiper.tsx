'use client';

import { CartLine, Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { ProductImage } from './ProductImage';

interface BrandSwiperProps {
  alternatives: Product[];
  /** Current cart to show quantities for each product */
  cart: CartLine[];
  /** Add product to cart */
  onAdd: (product: Product) => void;
  /** Increment product quantity */
  onIncrement: (productId: string) => void;
  /** Decrement product quantity */
  onDecrement: (productId: string) => void;
}

/**
 * Brand_Swiper. Horizontally scrollable alternatives for one category.
 * Users can add multiple products from the same category with +/- controls.
 */
export function BrandSwiper({ alternatives, cart, onAdd, onIncrement, onDecrement }: BrandSwiperProps) {
  const getQuantity = (productId: string): number => {
    return cart.find((line) => line.product.id === productId)?.quantity ?? 0;
  };

  return (
    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
      {alternatives.map((p) => {
        const quantity = getQuantity(p.id);
        const inCart = quantity > 0;
        const hasDiscount = p.actualPrice > p.price;
        
        return (
          <div
            key={p.id}
            className={`flex w-36 sm:w-44 shrink-0 flex-col rounded-xl border-2 p-2 sm:p-3 transition ${
              inCart ? 'bg-[var(--accent-soft)] border-[var(--accent)]' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex h-20 sm:h-24 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
              <ProductImage
                src={p.image}
                alt={p.name}
                category={p.component}
                brand={p.brand}
                className="h-full w-full object-contain"
              />
            </div>
            
            <span className="mt-1.5 sm:mt-2 line-clamp-2 text-xs sm:text-sm font-medium text-gray-800 leading-tight">{p.name}</span>
            
            {p.ratings > 0 && (
              <span className="mt-1 text-[10px] sm:text-xs text-amber-600">
                ★ {p.ratings.toFixed(1)}
                <span className="ml-1 text-gray-400">({p.noOfRatings.toLocaleString('en-IN')})</span>
              </span>
            )}
            
            <span className="mt-1 flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-semibold text-gray-900">
                {formatPrice(p.price, p.currency)}
              </span>
              {hasDiscount && (
                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                  {formatPrice(p.actualPrice, p.currency)}
                </span>
              )}
            </span>

            {/* Quantity Controls */}
            {inCart ? (
              <div className="mt-2 flex items-center justify-between gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => onDecrement(p.id)}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100 active:scale-95"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                
                <span className="flex-1 text-center text-xs sm:text-sm font-bold text-gray-900">
                  {quantity}
                </span>
                
                <button
                  type="button"
                  onClick={() => onIncrement(p.id)}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border transition active:scale-95"
                  style={{ 
                    borderColor: 'var(--accent)', 
                    background: 'var(--accent)', 
                    color: 'var(--accent-fg)' 
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAdd(p)}
                className="mt-2 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition active:scale-95"
                style={{ border: '1px solid var(--accent)', color: 'var(--accent)' }}
              >
                Add
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
