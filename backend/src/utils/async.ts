/** Async control-flow helpers: timeout wrapping and bounded retry. */

export class TimeoutError extends Error {
  constructor(message = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Rejects with the provided `onTimeout` error (or a generic TimeoutError) if
 * `promise` does not settle within `ms` milliseconds.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout?: () => Error,
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(onTimeout ? onTimeout() : new TimeoutError()), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}

export interface RetryOptions {
  /** Total attempts cap (e.g. 3 retries per Requirement 11.1). */
  retries: number;
  /** Base delay between attempts (ms). */
  delayMs?: number;
  /** Called before each retry with the attempt number (1-based). */
  onRetry?: (attempt: number, error: unknown) => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs `fn` up to `retries` times. Returns the first success or throws the
 * last error after the final attempt fails.
 */
export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  const { retries, delayMs = 0, onRetry } = opts;
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        onRetry?.(attempt, err);
        if (delayMs > 0) await sleep(delayMs);
      }
    }
  }
  throw lastError;
}
