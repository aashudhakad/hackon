import { NextFunction, Request, Response } from 'express';

/**
 * Wraps an async route handler so thrown errors/rejections are forwarded to
 * Express's error pipeline (and thus to the central error handler).
 */
export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as T, res, next).catch(next);
  };
}
