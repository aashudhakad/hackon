import { NextFunction, Request, Response } from 'express';
import { authService } from '../services/authService';
import { AppError } from '../errors';

export interface AuthenticatedRequest extends Request {
  user?: any; // Can be passport user or our custom user object
}

/**
 * Middleware to protect routes requiring authentication.
 * Validates JWT token from Authorization header and attaches user info to request.
 */
export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError('No authorization token provided.', 401, 'NO_TOKEN');
    }

    // Validate Bearer format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError('Invalid authorization header format. Use: Bearer <token>', 401, 'INVALID_AUTH_FORMAT');
    }

    const token = parts[1];

    // Verify token
    const payload = authService.verifyToken(token);

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    // If it's already an AppError, pass it along
    if (error instanceof AppError) {
      next(error);
      return;
    }

    // Otherwise wrap in generic auth error
    next(new AppError('Authentication failed.', 401, 'AUTH_FAILED'));
  }
}
