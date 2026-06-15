'use client';

import { SmartBundle } from '@/lib/types';

interface SmartBundlesGridProps {
  bundles: SmartBundle[];
  onSelect: (id: string) => void;
  disabled?: boolean;
}

const getIconForBundle = (id: string, label: string) => {
  const t = label.toLowerCase();
  const i = id.toLowerCase();
  
  if (i.includes('movie') || t.includes('movie')) return '🍿';
  if (i.includes('maggi') || t.includes('maggi') || t.includes('noodle')) return '🍜';
  if (i.includes('workout') || t.includes('gym')) return '🏋️‍♂️';
  if (i.includes('guest') || t.includes('host')) return '🏠';
  if (i.includes('rain') || t.includes('weather')) return '🌧️';
  if (i.includes('clean') || t.includes('wash') || t.includes('emergency')) return '🧹';
  if (i.includes('breakfast') || t.includes('morning')) return '🍳';
  if (i.includes('hangover') || t.includes('party')) return '🍋';
  if (i.includes('period') || t.includes('cramp') || t.includes('care')) return '🌸';
  if (i.includes('office') || t.includes('desk')) return '💻';
  if (i.includes('recovery') || t.includes('sick')) return '💊';
  
  return '🛍️'; 
};

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
            className="group relative flex h-28 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:border-[var(--accent)] hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 transition-transform duration-300 group-hover:scale-110 group-hover:bg-white group-hover:shadow-sm">
              <span className="text-2xl drop-shadow-sm">
                {getIconForBundle(b.id, b.label)}
              </span>
            </div>
            
            <span className="relative z-10 line-clamp-2 text-center text-xs font-semibold leading-tight text-gray-700 transition-colors group-hover:text-gray-900">
              {b.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}