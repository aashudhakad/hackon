'use client';

import { SmartBundle } from '@/lib/types';

interface SmartBundlesGridProps {
  bundles: SmartBundle[];
  onSelect: (id: string) => void;
  disabled?: boolean;
}

/**
 * Smart_Bundles_Grid (Requirements 1.4-1.6, 2.1). Renders up to 6 cards
 * (clamped by the backend) with their situation labels.
 */
export function SmartBundlesGrid({ bundles, onSelect, disabled }: SmartBundlesGridProps) {
  if (bundles.length === 0) return null;

  return (
    <section className="mt-10 w-full">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
        Or start with a Smart Bundle
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {bundles.slice(0, 6).map((b) => (
          <button
            key={b.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(b.id)}
            className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-[var(--accent)] hover:shadow disabled:opacity-50"
          >
            <span className="line-clamp-2 font-medium text-gray-800">{b.label}</span>
            <span className="mt-2 block text-xs text-[var(--accent)]">Tap to load basket →</span>
          </button>
        ))}
      </div>
    </section>
  );
}
