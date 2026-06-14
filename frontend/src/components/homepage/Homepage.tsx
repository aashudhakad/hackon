'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getGeo, tzOffsetMinutes } from '@/lib/geo';
import { HomepageFull, HomepageIntent } from '@/lib/types';
import { SectionHeader } from './SectionHeader';
import { IntentCard } from './IntentCard';
import { TrendingCard } from './TrendingCard';
import { HomeSkeleton } from './HomeSkeleton';

interface HomepageProps {
  /** Runs a predicted/trending intent through the existing shopping flow. */
  onIntent: (query: string) => void;
  /** Loads a prebuilt smart bundle. */
  onBundle: (id: string) => void;
  disabled?: boolean;
}

const TIME_GREETING: Record<string, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  night: 'Up late',
};

/**
 * Intelligent homepage module: Personalized Intents (AI) + Trending Near You
 * (analytics) + Smart Bundles (prebuilt). Self-contained — fetches its own data
 * and calls back into the existing shopping flow on card taps.
 */
export function Homepage({ onIntent, onBundle, disabled }: HomepageProps) {
  const [data, setData] = useState<HomepageFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const geo = await getGeo();
        const full = await api.homepageFull({
          lat: geo?.lat,
          lon: geo?.lon,
          tz: tzOffsetMinutes(),
        });
        if (!cancelled) setData(full);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <HomeSkeleton />;

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        Couldn&apos;t load recommendations right now. You can still type or speak your intent above.
      </div>
    );
  }

  const { personalized, trending, smartBundles } = data;
  const ctx = personalized.context;
  const handleIntent = (i: HomepageIntent) => onIntent(i.query);

  return (
    <div className="space-y-9">
      {/* Personalized */}
      {personalized.intents.length > 0 && (
        <section>
          <SectionHeader
            title="Personalized for you"
            subtitle={`${TIME_GREETING[ctx.timeBucket]} · ${ctx.weather.condition}`}
            icon="✨"
          />
          <div className="flex gap-3 overflow-x-auto pb-1">
            {personalized.intents.map((i) => (
              <IntentCard key={i.id} intent={i} onClick={handleIntent} />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      {trending.intents.length > 0 && (
        <section>
          <SectionHeader title="Trending near you" icon="📍" />
          <div className="flex gap-3 overflow-x-auto pb-1">
            {trending.intents.map((i, idx) => (
              <TrendingCard key={i.id} intent={i} rank={idx + 1} onClick={handleIntent} />
            ))}
          </div>
        </section>
      )}

      {/* Smart Bundles */}
      {smartBundles.smartBundles.length > 0 && (
        <section>
          <SectionHeader title="Smart bundles" subtitle="One-tap baskets" icon="⚡" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {smartBundles.smartBundles.map((b) => (
              <button
                key={b.id}
                type="button"
                disabled={disabled}
                onClick={() => onBundle(b.id)}
                className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-[var(--accent)] hover:shadow disabled:opacity-50"
              >
                <span className="line-clamp-2 font-medium text-gray-800">{b.label}</span>
                <span className="mt-2 block text-xs text-[var(--accent)]">Tap to load basket →</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
