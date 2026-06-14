import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../errors';

/**
 * Validates `req.body` against a Zod schema. On failure, throws a 400 AppError
 * with the validation issues so the central handler shapes the response.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new AppError('Invalid request body.', 400, 'VALIDATION_ERROR', {
          issues: result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        }),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}
