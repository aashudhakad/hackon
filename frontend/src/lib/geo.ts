/** Browser geolocation helper. Resolves to null if denied/unavailable. */
export function getGeo(timeoutMs = 5000): Promise<{ lat: number; lon: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: timeoutMs, maximumAge: 10 * 60 * 1000 },
    );
  });
}

/** Client timezone offset in minutes (e.g. IST returns -330). */
export function tzOffsetMinutes(): number {
  return new Date().getTimezoneOffset();
}
