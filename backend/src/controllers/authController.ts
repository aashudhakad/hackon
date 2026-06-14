import { Response, Request } from 'express';
import { authService } from '../services/authService';
import { SignupInput, LoginInput } from './authSchemas';

export interface AuthRequest<T = unknown> extends Request {
  body: T;
  user?: any; // Passport user or our custom user object
}

/**
 * POST /api/auth/signup - Register a new user
 */
export async function signup(req: AuthRequest<SignupInput>, res: Response): Promise<void> {
  const { email, password, username } = req.body;
  const result = await authService.signup(email, password, username);
  res.status(201).json(result);
}

/**
 * POST /api/auth/login - Authenticate user
 */
export async function login(req: AuthRequest<LoginInput>, res: Response): Promise<void> {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(result);
}

/**
 * GET /api/auth/me - Get current user profile
 */
export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user || !req.user.userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const profile = await authService.getUserProfile(req.user.userId);
  res.json(profile);
}

/**
 * GET /api/auth/google/callback - Google OAuth callback
 */
export async function googleCallback(req: AuthRequest, res: Response): Promise<void> {
  try {
    // User is attached by passport
    const user = req.user as any;
    
    if (!user) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
      return;
    }

    // Generate JWT token
    const result = await authService.googleAuth(user);
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${result.token}`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=server_error`);
  }
}
