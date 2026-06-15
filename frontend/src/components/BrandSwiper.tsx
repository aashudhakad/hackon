'use client';

import { CartLine, Product } from '@/lib/types';
import { ProductCard } from './ProductCard';

interface BrandSwiperProps {
  alternatives: Product[];
  /** Current cart to show quantities for each product */
  cart: CartLine[];
  onAdd: (product: Product) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
}

/**
 * Brand_Swiper. Horizontally scrollable alternatives for one category, rendered
 * with the shared theme-reactive ProductCard. Users can add multiple products
 * from the same category with the +/- stepper.
 */
export function BrandSwiper({ alternatives, cart, onAdd, onIncrement, onDecrement }: BrandSwiperProps) {
  const getQuantity = (productId: string): number =>
    cart.find((line) => line.product.id === productId)?.quantity ?? 0;

  return (
    <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-0">
      {alternatives.map((p) => (
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
  );
}
