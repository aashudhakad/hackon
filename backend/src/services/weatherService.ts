import { logger } from '../config/logger';
import { withTimeout } from '../utils/async';
import { homepageCache } from '../repositories/homepageCache';
import { WeatherBucket, WeatherInfo } from '../types/homepage';

/**
 * Current-weather lookup via Open-Meteo (free, no API key).
 * Result is cached ~30 min per coarse lat/lon cell. Any failure returns an
 * 'unknown' weather bucket so the homepage still renders.
 */
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 6_000;
const TTL_SECONDS = 30 * 60;

/** Maps Open-Meteo WMO weather codes + temperature to a coarse bucket. */
function toBucket(tempC: number | null, code: number): WeatherBucket {
  // Rain / drizzle / thunderstorm / snow codes.
  const wet = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];
  if (wet.includes(code)) return 'rainy';
  if (tempC === null) return 'unknown';
  if (tempC >= 30) return 'hot';
  if (tempC <= 15) return 'cold';
  return 'pleasant';
}

function conditionLabel(bucket: WeatherBucket, tempC: number | null): string {
  switch (bucket) {
    case 'hot':
      return `Hot (${tempC}°C)`;
    case 'cold':
      return `Cold (${tempC}°C)`;
    case 'rainy':
      return 'Rainy';
    case 'pleasant':
      return `Pleasant (${tempC}°C)`;
    default:
      return 'Unknown';
  }
}

const UNKNOWN: WeatherInfo = { tempC: null, condition: 'Unknown', bucket: 'unknown' };

export async function getWeather(lat?: number, lon?: number): Promise<WeatherInfo> {
  if (typeof lat !== 'number' || typeof lon !== 'number') return UNKNOWN;

  const cacheKey = `weather:${lat.toFixed(1)}:${lon.toFixed(1)}`;
  const cached = await homepageCache.get<WeatherInfo>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
    const res = await withTimeout(fetch(url), TIMEOUT_MS);
    if (!res.ok) throw new Error(`weather HTTP ${res.status}`);
    const data = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const tempC = data.current?.temperature_2m ?? null;
    const code = data.current?.weather_code ?? -1;
    const bucket = toBucket(tempC, code);
    const info: WeatherInfo = {
      tempC: tempC === null ? null : Math.round(tempC),
      condition: conditionLabel(bucket, tempC === null ? null : Math.round(tempC)),
      bucket,
    };
    await homepageCache.set(cacheKey, info, TTL_SECONDS);
    return info;
  } catch (err) {
    logger.warn('weather lookup failed', { error: (err as Error).message });
    return UNKNOWN;
  }
}
