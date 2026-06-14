'use client';

import { BasketTier, TierName, TIER_NAMES } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { BoltIcon } from './icons';

interface TierBasketsProps {
  tiers: Record<TierName, BasketTier>;
  activeTier: TierName;
  onSelectTier: (tier: TierName) => void;
}

/**
 * Flash mode Super-Quick 3-tier baskets. Three tabs (Budget/Balanced/Premium),
 * Balanced active by default. Selecting a tab makes that whole basket the active
 * cart for 1-click checkout. The items list shows what's inside.
 */
export function TierBaskets({ tiers, activeTier, onSelectTier }: TierBasketsProps) {
  const tier = tiers[activeTier];
  const items = tier?.items ?? [];
  const currency = items[0]?.currency ?? 'INR';

  return (
    <section className="rounded-2xl border-2 border-red-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <BoltIcon className="flash-bolt h-5 w-5 text-red-600" />
        <h2 className="font-bold text-gray-900">Flash baskets — pick one, check out instantly</h2>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {TIER_NAMES.map((name) => {
          const isActive = name === activeTier;
          const total = tiers[name]?.total ?? 0;
          const cur = tiers[name]?.items[0]?.currency ?? 'INR';
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelectTier(name)}
              className={`rounded-xl border-2 p-3 text-center transition ${
                isActive
                  ? 'border-red-600 bg-red-600 text-white shadow-lg'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-red-300'
              }`}
            >
              <span className="block text-sm font-bold">{name}</span>
              <span className={`mt-0.5 block text-xs ${isActive ? 'text-red-50' : 'text-gray-500'}`}>
                {formatPrice(total, cur)}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-50">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={p.name} className="h-full w-full object-contain" />
              ) : (
                <span className="text-[9px] text-gray-400">{p.brand}</span>
              )}
            </div>
            <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{p.name}</span>
            <span className="text-sm font-medium text-gray-900">{formatPrice(p.price, p.currency)}</span>
          </li>
        ))}
        {items.length === 0 && (
          <li className="py-4 text-center text-sm text-gray-500">No items available for this basket.</li>
        )}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-sm font-semibold text-gray-700">{activeTier} basket total</span>
        <span className="text-lg font-bold text-red-600">{formatPrice(tier?.total ?? 0, currency)}</span>
      </div>
    </section>
  );
}
