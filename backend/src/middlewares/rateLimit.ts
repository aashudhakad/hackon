import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';
import { AppError } from '../errors';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

/**
 * Rate limiting middleware using Redis.
 * Limits requests per IP address within a time window.
 */
export function rateLimit(options: RateLimitOptions) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const redisClient = getRedis();
      
      // If Redis is unavailable, skip rate limiting (fail open)
      if (!redisClient) {
        next();
        return;
      }

      // Check if Redis connection is ready
      if (redisClient.status !== 'ready') {
        next();
        return;
      }

      // Get client IP address
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
      const key = `ratelimit:${req.path}:${ip}`;

      // Get current count
      const current = await redisClient.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= options.maxRequests) {
        throw new AppError('Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
      }

      // Increment counter
      const newCount = await redisClient.incr(key);

      // Set expiry on first request
      if (newCount === 1) {
        await redisClient.pexpire(key, options.windowMs);
      }

      next();
    } catch (error) {
      // If it's a rate limit error, pass it through
      if (error instanceof AppError && error.statusCode === 429) {
        next(error);
        return;
      }
      // For other errors (like Redis connection issues), just skip rate limiting
      next();
    }
  };
}

// Preconfigured rate limiters for auth endpoints
export const signupRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
});
