'use client';

import { Star } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { ProductImage } from './ProductImage';
import { Button } from './ui/Button';
import { QuantityStepper } from './ui/QuantityStepper';

type Tone = 'accent' | 'flash';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAdd: (product: Product) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  /** `grid` = vertical swiper card, `row` = horizontal list item. */
  layout?: 'grid' | 'row';
  tone?: Tone;
  className?: string;
}

function discountPct(actual: number, price: number): number | null {
  if (actual > price && actual > 0) return Math.round(((actual - price) / actual) * 100);
  return null;
}

/**
 * Unified, theme-reactive product card (Blinkit/Zepto style).
 *
 * - `grid`: vertical card for horizontal swipers (Category grid, cross-sell).
 * - `row`:  compact horizontal item for tier baskets / lists.
 *
 * Shows a discount badge, rating pill, strikethrough MRP, and an ADD button
 * that swaps to a solid quantity stepper once the item is in the cart.
 */
export function ProductCard({
  product: p,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  layout = 'grid',
  tone = 'accent',
  className = '',
}: ProductCardProps) {
  const inCart = quantity > 0;
  const off = discountPct(p.actualPrice, p.price);
  const selectedRing =
    tone === 'flash' ? 'border-flash-500 bg-flash-50' : 'border-accent bg-accent-soft';

  if (layout === 'row') {
    return (
      <li
        className={`flex items-center gap-3 rounded-xl border p-2.5 transition ${
          inCart ? selectedRing : 'border-gray-100 bg-white hover:border-gray-200'
        } ${className}`}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
          <ProductImage src={p.image} alt={p.name} category={p.component} brand={p.brand} className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-gray-800">{p.name}</span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-gray-900">{formatPrice(p.price, p.currency)}</span>
            {off && <span className="text-xs text-gray-400 line-through">{formatPrice(p.actualPrice, p.currency)}</span>}
          </span>
        </div>
        {inCart ? (
          <QuantityStepper
            quantity={quantity}
            onIncrement={() => onIncrement(p.id)}
            onDecrement={() => onDecrement(p.id)}
            tone={tone}
            size="sm"
          />
        ) : (
          <Button variant="outline" tone={tone} size="sm" onClick={() => onAdd(p)}>
            ADD
          </Button>
        )}
      </li>
    );
  }

  // grid layout
  return (
    <div
      className={`flex w-36 shrink-0 flex-col rounded-2xl border bg-white p-2.5 shadow-card transition hover:shadow-card-hover sm:w-44 sm:p-3 ${
        inCart ? selectedRing : 'border-gray-100'
      } ${className}`}
    >
      <div className="relative">
        {off && (
          <span
            className={`absolute left-1 top-1 z-10 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white ${
              tone === 'flash' ? 'bg-flash-600' : 'bg-accent'
            }`}
          >
            {off}% OFF
          </span>
        )}
        <div className="flex h-24 items-center justify-center overflow-hidden rounded-xl bg-gray-50 sm:h-28">
          <ProductImage src={p.image} alt={p.name} category={p.component} brand={p.brand} className="h-full w-full object-contain" />
        </div>
      </div>

      <span className="mt-2 line-clamp-2 min-h-[2rem] text-xs font-medium leading-tight text-gray-800 sm:text-sm">
        {p.name}
      </span>

      {p.ratings > 0 && (
        <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 sm:text-xs">
          <Star size={11} className="fill-green-600 text-green-600" />
          {p.ratings.toFixed(1)}
          <span className="font-normal text-green-600/70">({p.noOfRatings.toLocaleString('en-IN')})</span>
        </span>
      )}

      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-sm font-bold text-gray-900">{formatPrice(p.price, p.currency)}</span>
        {off && <span className="text-[10px] text-gray-400 line-through sm:text-xs">{formatPrice(p.actualPrice, p.currency)}</span>}
      </div>

      <div className="mt-2">
        {inCart ? (
          <QuantityStepper
            quantity={quantity}
            onIncrement={() => onIncrement(p.id)}
            onDecrement={() => onDecrement(p.id)}
            tone={tone}
            size="md"
            className="w-full"
          />
        ) : (
          <Button variant="outline" tone={tone} size="sm" fullWidth onClick={() => onAdd(p)}>
            ADD
          </Button>
        )}
      </div>
    </div>
  );
}
