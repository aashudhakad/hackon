import { SmartBundle } from './domain';

/** A clickable homepage card that maps to a shopping intent. */
export interface HomepageIntent {
  /** Stable id for keys/analytics. */
  id: string;
  /** Display title, e.g. "Beat the Heat". */
  title: string;
  /** The shopping-intent text fed into the existing quick/flash flow. */
  query: string;
  /** Optional emoji/icon hint for the card. */
  emoji?: string;
  /** Where this card came from. */
  source: 'personalized' | 'trending';
  /** Personalized only: 0..100 prediction confidence. */
  confidence?: number;
  /** Personalized only: short human explanation. */
  reason?: string;
}

export type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night';
export type WeatherBucket = 'hot' | 'cold' | 'rainy' | 'pleasant' | 'unknown';
export type Season = 'summer' | 'monsoon' | 'autumn' | 'winter';

export interface WeatherInfo {
  tempC: number | null;
  condition: string;
  bucket: WeatherBucket;
}

/** Context used to personalize the homepage. */
export interface HomepageContext {
  timeBucket: TimeBucket;
  dayOfWeek: string; // e.g. "Saturday"
  isWeekend: boolean;
  season: Season;
  weather: WeatherInfo;
  location: { pincode?: string; lat?: number; lon?: number } | null;
}

export interface PersonalizedResponse {
  intents: HomepageIntent[];
  context: HomepageContext;
  cached: boolean;
}

export interface TrendingResponse {
  intents: HomepageIntent[];
  cached: boolean;
}

export interface SmartBundlesResponse {
  smartBundles: SmartBundle[];
  cached: boolean;
}

export interface HomepageFullResponse {
  personalized: PersonalizedResponse;
  trending: TrendingResponse;
  smartBundles: SmartBundlesResponse;
}
