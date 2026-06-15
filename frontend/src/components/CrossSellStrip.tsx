'use client';

import { Sparkles } from 'lucide-react';
import { CartLine, Product } from '@/lib/types';
import { ProductCard } from './ProductCard';

interface CrossSellStripProps {
  products: Product[];
  cart: CartLine[];
  onAdd: (product: Product) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
}

/**
 * Cross_Sell_Strip — thematic add-ons rendered with the shared ProductCard.
 * Hidden entirely when there are no suggestions.
 */
export function CrossSellStrip({ products, cart, onAdd, onIncrement, onDecrement }: CrossSellStripProps) {
  if (products.length === 0) return null;

  const getQuantity = (productId: string): number =>
    cart.find((line) => line.product.id === productId)?.quantity ?? 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-card sm:p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <Sparkles size={14} className="text-accent" />
        You might also need
      </p>
      <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-0">
        {products.map((p) => (
          <div key={p.id} className="snap-start">
            <ProductCard
              product={p}
              quantity={getQuantity(p.id)}
              onAdd={onAdd}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              layout="grid"
              tone="accent"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
