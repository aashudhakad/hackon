import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/userRepository';
import { AppError } from '../errors';
import { env } from '../config/env';
import { IUser } from '../models/User';
import { logger } from '../config/logger';

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
    profilePicture?: string;
    authProvider: string;
    createdAt: Date;
  };
}

class AuthService {
  /**
   * Register a new user and return JWT token.
   */
  async signup(email: string, password: string): Promise<AuthResponse> {
    // Check if user already exists
    const exists = await userRepository.emailExists(email);
    if (exists) {
      logger.warn(`Signup attempt with existing email: ${email}`);
      throw new AppError('Email is already registered.', 409, 'EMAIL_EXISTS');
    }

    // Create user (password hashing is handled by the User model pre-save hook)
    const user = await userRepository.createUser(email, password);

    // Generate JWT token
    const token = this.generateToken(user);

    logger.info(`User registered successfully: ${user.email}`);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Authenticate user and return JWT token.
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Find user with password field
    const user = await userRepository.findByEmailWithPassword(email);

    // Perform dummy hash comparison if user not found (timing attack prevention)
    if (!user) {
      await bcrypt.compare(password, '$2b$10$dummyhashtopreventtimingattacks');
      logger.warn(`Login attempt with non-existent email: ${email}`);
      throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
    }

    // Compare password using constant-time comparison
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for user: ${email}`);
      throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    logger.info(`User logged in successfully: ${user.email}`);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Authenticate Google OAuth user and return JWT token.
   */
  async googleAuth(user: IUser): Promise<AuthResponse> {
    const token = this.generateToken(user);
    
    logger.info(`Google user authenticated: ${user.email}`);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Generate a JWT token for a user.
   */
  generateToken(user: IUser): string {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
    };

    // Use direct string for expiresIn to avoid type issues
    return jwt.sign(payload, env.jwt.secret, {
      expiresIn: '7d',
      algorithm: 'HS256',
    });
  }

  /**
   * Verify and decode a JWT token.
   */
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, env.jwt.secret, {
        algorithms: ['HS256'],
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token has expired.', 401, 'TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token.', 401, 'INVALID_TOKEN');
      }
      throw new AppError('Token verification failed.', 401, 'TOKEN_VERIFICATION_FAILED');
    }
  }

  /**
   * Get user profile by ID.
   */
  async getUserProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      profilePicture: user.profilePicture,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
