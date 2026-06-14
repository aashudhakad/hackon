'use client';

import { CartLine, CategoryRow, Product } from '@/lib/types';
import { selectedIdForCategory } from '@/lib/bundle';
import { BrandSwiper } from './BrandSwiper';

interface CategoryGridProps {
  rows: CategoryRow[];
  /** Current cart, used to derive the selected product per category. */
  cart: CartLine[];
  onToggle: (product: Product) => void;
}

/**
 * Quick mode Category_Grid. One row per required component in sequence, each
 * labeled with its component name and showing a Brand_Swiper whose active
 * selection is the product currently in the basket for that category.
 */
export function CategoryGrid({ rows, cart, onToggle }: CategoryGridProps) {
  return (
    <div className="space-y-6">
      {rows.map((row) => {
        const name = row.component.name;
        const isEmpty = row.alternatives.length === 0;
        const selectedId = selectedIdForCategory(cart, name);

        return (
          <section key={name}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="font-semibold capitalize text-gray-800">{name.replace(/_/g, ' ')}</h3>
              {selectedId && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}
                >
                  in basket
                </span>
              )}
            </div>

            {isEmpty ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                No alternatives available for {name.replace(/_/g, ' ')}.
              </div>
            ) : (
              <BrandSwiper alternatives={row.alternatives} selectedId={selectedId} onToggle={onToggle} />
            )}
          </section>
        );
      })}
    </div>
  );
}
