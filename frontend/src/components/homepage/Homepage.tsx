'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getGeo, tzOffsetMinutes } from '@/lib/geo';
import { getCached, setCached } from '@/lib/clientCache';
import { HomepageFull, HomepageIntent } from '@/lib/types';
import { SectionHeader } from './SectionHeader';
import { IntentCard } from './IntentCard';
import { TrendingCard } from './TrendingCard';
import { HomeSkeleton } from './HomeSkeleton';

const CACHE_KEY = 'aie:homepage:v1';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

interface HomepageProps {
  onIntent: (query: string) => void;
  onBundle: (id: string) => void;
  disabled?: boolean;
}

const TIME_GREETING: Record<string, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  night: 'Up late',
};

// 🎯 Smart Icon Mapper Logic
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
  
  return '🛍️'; // Default
};

export function Homepage({ onIntent, onBundle, disabled }: HomepageProps) {
  const [data, setData] = useState<HomepageFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = getCached<HomepageFull>(CACHE_KEY, CACHE_TTL_MS);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);
      try {
        const geo = await getGeo();
        const full = await api.homepageFull({
          lat: geo?.lat,
          lon: geo?.lon,
          tz: tzOffsetMinutes(),
        });
        if (!cancelled) {
          setData(full);
          setCached(CACHE_KEY, full);
        }
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

      {/* Smart Bundles (NOW UPDATED WITH PREMIUM ICONS) */}
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
                className="group relative flex h-28 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:border-[var(--accent)] hover:shadow-md active:scale-95 disabled:opacity-50"
              >
                {/* Subtle Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                {/* 3D Emoji Icon wrapper */}
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 transition-transform duration-300 group-hover:scale-110 group-hover:bg-white group-hover:shadow-sm">
                  <span className="text-2xl drop-shadow-sm">
                    {getIconForBundle(b.id, b.label)}
                  </span>
                </div>
                
                {/* Label */}
                <span className="relative z-10 line-clamp-2 text-center text-xs font-semibold leading-tight text-gray-700 transition-colors group-hover:text-gray-900">
                  {b.label}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}