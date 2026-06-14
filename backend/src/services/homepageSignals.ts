import { orderRepository } from '../repositories/orderRepository';
import { HomepageContext, Season, TimeBucket, WeatherInfo } from '../types/homepage';

/**
 * Deterministic, analytics-style signals for the homepage:
 *  - time/day/season context (server clock, optional client tz offset)
 *  - top categories from recent orders (behavior signal / trending source)
 */

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function timeBucketFromHour(hour: number): TimeBucket {
  if (hour < 5) return 'night';
  if (hour < 11) return 'morning';
  if (hour < 16) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

/** India-centric season from month index (0-11). */
export function seasonFromMonth(month: number): Season {
  if (month >= 2 && month <= 5) return 'summer'; // Mar–Jun
  if (month >= 6 && month <= 8) return 'monsoon'; // Jul–Sep
  if (month >= 9 && month <= 10) return 'autumn'; // Oct–Nov
  return 'winter'; // Dec–Feb
}

/**
 * Builds homepage context. `tzOffsetMinutes` is the client's getTimezoneOffset()
 * (minutes behind UTC, e.g. IST = -330); when omitted, server local time is used.
 */
export function buildContext(
  weather: WeatherInfo,
  location: HomepageContext['location'],
  tzOffsetMinutes?: number,
): HomepageContext {
  const now =
    typeof tzOffsetMinutes === 'number'
      ? new Date(Date.now() - tzOffsetMinutes * 60_000)
      : new Date();

  const hour = now.getUTCHours();
  const dayIdx = now.getUTCDay();

  return {
    timeBucket: timeBucketFromHour(hour),
    dayOfWeek: DAYS[dayIdx],
    isWeekend: dayIdx === 0 || dayIdx === 6,
    season: seasonFromMonth(now.getUTCMonth()),
    weather,
    location,
  };
}

/** Humanizes a stored category key ("cold drinks" / "green_tea") for display. */
export function humanizeCategory(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Top categories by frequency across recent orders. Returns lowercased category
 * keys (matching the stored `category` field), most frequent first.
 */
export async function topOrderedCategories(limit = 10): Promise<string[]> {
  const orders = await orderRepository.recent(40);
  const counts = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      const cat = (item.category || item.component || '').trim().toLowerCase();
      if (cat) counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([cat]) => cat);
}
