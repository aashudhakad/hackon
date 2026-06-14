'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';

interface CrossSellStripProps {
  products: Product[];
  onAdd: (product: Product) => Promise<void> | void;
}

/**
 * Cross_Sell_Strip (Requirements 6.1-6.7). Pinned to the bottom; shows 3-4
 * thematic products (hidden when none). Tapping adds to cart with a brief
 * loading state.
 */
export function CrossSellStrip({ products, onAdd }: CrossSellStripProps) {
  const [addingId, setAddingId] = useState<string | null>(null);

  if (products.length === 0) return null;

  const handleAdd = async (product: Product) => {
    setAddingId(product.id);
    try {
      // Ensure a visible loading state for >= 50ms (Requirement 6.5).
      await Promise.all([onAdd(product), new Promise((r) => setTimeout(r, 60))]);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        You might also need
      </p>
      <div className="flex gap-3 overflow-x-auto">
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={addingId === p.id}
            onClick={() => handleAdd(p)}
            className="flex w-32 shrink-0 flex-col rounded-xl border border-gray-200 bg-white p-2 text-left transition hover:border-[var(--accent)] disabled:opacity-60"
          >
            <div className="flex h-16 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={p.name} className="h-full w-full object-contain" loading="lazy" />
              ) : (
                <span className="text-[10px] text-gray-400">{p.brand}</span>
              )}
            </div>
            <span className="mt-1 line-clamp-2 text-xs font-medium text-gray-800">{p.name}</span>
            <span className="mt-1 text-sm font-semibold text-gray-900">
              {formatPrice(p.price, p.currency)}
            </span>
            <span className="mt-1 text-xs font-medium text-[var(--accent)]">
              {addingId === p.id ? 'Adding…' : '+ Add'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
