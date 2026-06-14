/**
 * Tiny localStorage cache with TTL. Used to avoid refetching the homepage
 * recommendations on every page load/refresh — they only refresh after the TTL.
 */
interface Entry<T> {
  ts: number;
  value: T;
}

export function getCached<T>(key: string, ttlMs: number): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (Date.now() - entry.ts > ttlMs) {
      window.localStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export function setCached<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ ts: Date.now(), value } as Entry<T>));
  } catch {
    // Storage full / unavailable — ignore, it's just a cache.
  }
}
