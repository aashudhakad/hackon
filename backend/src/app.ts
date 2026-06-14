import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import session from 'express-session';
import passport from './config/passport';
import { env } from './config/env';
import { isMongoConnected } from './config/db';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

/**
 * Builds and configures the Express application. Kept separate from the server
 * bootstrap so it can be imported by integration tests.
 *
 * NOTE: The API is currently unauthenticated. Before exposing this service
 * publicly, add authentication/authorization (e.g. API keys or JWT) and rate
 * limiting in front of the mutating routes (/api/checkout in particular).
 */
export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins.length > 0 ? env.corsOrigins : true,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Session middleware for passport
  app.use(
    session({
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: env.nodeEnv === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Health/readiness probe.
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      mongo: isMongoConnected() ? 'connected' : 'in-memory-fallback',
      llm: env.llmEnabled ? 'http' : 'stub',
      uptimeSeconds: Math.round(process.uptime()),
    });
  });

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
