'use client';

import { CartLine, CategoryRow, Product } from '@/lib/types';
import { BrandSwiper } from './BrandSwiper';

interface CategoryGridProps {
  rows: CategoryRow[];
  /** Current cart, used to show quantities for each product. */
  cart: CartLine[];
  onAdd: (product: Product) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
}

/**
 * Quick mode Category_Grid. One row per required component in sequence, each
 * labeled with its component name and showing a Brand_Swiper with quantity controls.
 * Users can now add multiple items from the same category.
 */
export function CategoryGrid({ rows, cart, onAdd, onIncrement, onDecrement }: CategoryGridProps) {
  // Count items in cart for this category
  const countForCategory = (componentName: string) => {
    return cart.filter((line) => line.product.component === componentName).length;
  };

  return (
    <div className="space-y-6">
      {rows.map((row) => {
        const name = row.component.name;
        const isEmpty = row.alternatives.length === 0;
        const itemCount = countForCategory(name);

        return (
          <section key={name}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="font-semibold capitalize text-gray-800">{name.replace(/_/g, ' ')}</h3>
              {itemCount > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}
                >
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in basket
                </span>
              )}
            </div>

            {isEmpty ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                No alternatives available for {name.replace(/_/g, ' ')}.
              </div>
            ) : (
              <BrandSwiper 
                alternatives={row.alternatives} 
                cart={cart}
                onAdd={onAdd}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}
