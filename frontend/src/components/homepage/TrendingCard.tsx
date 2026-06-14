'use client';

import { HomepageIntent } from '@/lib/types';

interface TrendingCardProps {
  intent: HomepageIntent;
  rank: number;
  onClick: (intent: HomepageIntent) => void;
}

/** Compact trending card: rank + emoji + title. */
export function TrendingCard({ intent, rank, onClick }: TrendingCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(intent)}
      className="flex w-36 shrink-0 flex-col items-start gap-2 rounded-2xl border border-gray-200 bg-white p-3 text-left transition hover:border-[var(--accent)] hover:shadow"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-2xl">
        {intent.emoji ?? '🔥'}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">#{rank} trending</p>
        <p className="text-sm font-semibold text-gray-800">{intent.title}</p>
      </div>
    </button>
  );
}
