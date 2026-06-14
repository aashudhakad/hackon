'use client';

import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';

interface BrandSwiperProps {
  alternatives: Product[];
  /** The product currently selected for this category (in the cart), or null. */
  selectedId: string | null;
  /** Toggle selection: select this product (swap) or drop it if already selected. */
  onToggle: (product: Product) => void;
}

/**
 * Brand_Swiper. Horizontally scrollable alternatives for one category. One
 * product is the active selection (in the basket); tapping another swaps it,
 * tapping the selected one drops it. Clear active-selection state.
 */
export function BrandSwiper({ alternatives, selectedId, onToggle }: BrandSwiperProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {alternatives.map((p) => {
        const selected = p.id === selectedId;
        const hasDiscount = p.actualPrice > p.price;
        return (
          <div
            key={p.id}
            className={`flex w-44 shrink-0 flex-col rounded-xl border-2 p-3 transition ${
              selected ? 'bg-[var(--accent-soft)]' : 'border-gray-200 bg-white'
            }`}
            style={selected ? { borderColor: 'var(--accent)' } : undefined}
          >
            <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={p.name} className="h-full w-full object-contain" loading="lazy" />
              ) : (
                <span className="text-xs text-gray-400">{p.brand}</span>
              )}
            </div>
            <span className="mt-2 line-clamp-2 text-sm font-medium text-gray-800">{p.name}</span>
            {p.ratings > 0 && (
              <span className="mt-1 text-xs text-amber-600">
                ★ {p.ratings.toFixed(1)}
                <span className="ml-1 text-gray-400">({p.noOfRatings.toLocaleString('en-IN')})</span>
              </span>
            )}
            <span className="mt-1 flex items-baseline gap-1">
              <span className="text-sm font-semibold text-gray-900">
                {formatPrice(p.price, p.currency)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(p.actualPrice, p.currency)}
                </span>
              )}
            </span>

            <button
              type="button"
              onClick={() => onToggle(p)}
              className="mt-2 rounded-lg px-3 py-1.5 text-sm font-medium transition"
              style={
                selected
                  ? { background: 'var(--accent)', color: 'var(--accent-fg)' }
                  : { border: '1px solid var(--accent)', color: 'var(--accent)' }
              }
            >
              {selected ? '✓ In basket — tap to remove' : 'Select'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
