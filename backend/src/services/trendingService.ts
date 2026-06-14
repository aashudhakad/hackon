import { topOrderedCategories, humanizeCategory } from './homepageSignals';
import { HomepageContext, HomepageIntent, Season, WeatherBucket } from '../types/homepage';

/**
 * Trending Near You — analytics-driven (NOT AI). Blends real local demand
 * (top categories from recent orders) with season/weather-relevant defaults,
 * then ranks by relevance to the user's current context.
 *
 * Note: orders currently carry no geo field, so "near you" is approximated by
 * recent global demand seeded with the user's pincode/region for stable
 * ordering. When per-order location is added, scope `topOrderedCategories`
 * to the user's warehouse/pincode for true locality.
 */

const SEASON_DEFAULTS: Record<Season, string[]> = {
  summer: ['cold drinks', 'ice cream', 'coconut water', 'fruit juices'],
  monsoon: ['instant noodles', 'tea', 'namkeen', 'cooking oil'],
  autumn: ['dry fruits', 'chocolate', 'biscuits', 'tea'],
  winter: ['coffee', 'green tea', 'soup', 'honey'],
};

const WEATHER_DEFAULTS: Record<WeatherBucket, string[]> = {
  hot: ['cold drinks', 'ice cream', 'coconut water'],
  cold: ['coffee', 'green tea', 'honey'],
  rainy: ['instant noodles', 'tea', 'namkeen'],
  pleasant: ['chips', 'chocolate', 'cookies'],
  unknown: [],
};

const EMOJI: Record<string, string> = {
  'cold drinks': '🥤', 'ice cream': '🍦', 'coconut water': '🥥', 'fruit juices': '🧃',
  'instant noodles': '🍜', tea: '🍵', namkeen: '🥨', coffee: '☕', 'green tea': '🍵',
  chips: '🥔', chocolate: '🍫', cookies: '🍪', biscuits: '🍪', 'dry fruits': '🥜',
  honey: '🍯', soup: '🍲', 'cooking oil': '🫙',
};

function toIntent(category: string, rank: number): HomepageIntent {
  return {
    id: `trend-${category.replace(/\s+/g, '-')}`,
    title: humanizeCategory(category),
    query: category,
    emoji: EMOJI[category] ?? '🔥',
    source: 'trending',
    confidence: Math.max(50, 95 - rank * 6),
  };
}

export async function getTrendingIntents(ctx: HomepageContext, limit = 6): Promise<HomepageIntent[]> {
  // 1) Real demand from recent orders (strongest signal).
  const ordered = await topOrderedCategories(8);

  // 2) Context-relevant defaults (weather first, then season).
  const contextual = [
    ...WEATHER_DEFAULTS[ctx.weather.bucket],
    ...SEASON_DEFAULTS[ctx.season],
  ];

  // Merge preserving priority: ordered demand → weather → season; de-duped.
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const cat of [...ordered, ...contextual]) {
    const key = cat.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      merged.push(key);
    }
  }

  return merged.slice(0, limit).map((cat, i) => toIntent(cat, i));
}
