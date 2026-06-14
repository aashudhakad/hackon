import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { AppError } from '../errors';
import { logger } from '../config/logger';

/**
 * Central error handler. Shapes a consistent JSON error envelope and preserves
 * any state details (e.g. retained intent text) attached to AppErrors.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // next is required for Express to treat this as an error handler.
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, ...(err.details ?? {}) },
    });
    return;
  }

  if (err instanceof MulterError) {
    const oversize = err.code === 'LIMIT_FILE_SIZE';
    res.status(400).json({
      error: {
        code: oversize ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR',
        message: oversize
          ? 'The uploaded file exceeds the 10 MB maximum size.'
          : `Upload error: ${err.message}`,
      },
    });
    return;
  }

  logger.error('Unhandled error', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  });
}

/** 404 handler for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
}
