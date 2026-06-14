'use client';

import { HomepageIntent } from '@/lib/types';

interface IntentCardProps {
  intent: HomepageIntent;
  onClick: (intent: HomepageIntent) => void;
}

/** Personalized intent card: emoji, title, reason, and a confidence chip. */
export function IntentCard({ intent, onClick }: IntentCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(intent)}
      className="group flex w-60 shrink-0 flex-col rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{intent.emoji ?? '✨'}</span>
        {typeof intent.confidence === 'number' && (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}
          >
            {intent.confidence}% match
          </span>
        )}
      </div>
      <h3 className="mt-2 font-semibold text-gray-900">{intent.title}</h3>
      {intent.reason && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{intent.reason}</p>}
      <span className="mt-3 text-xs font-medium text-[var(--accent)] group-hover:underline">
        Shop this →
      </span>
    </button>
  );
}
