import dotenv from 'dotenv';

dotenv.config();

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function str(value: string | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value : fallback;
}

export const env = {
  nodeEnv: str(process.env.NODE_ENV, 'development'),
  port: num(process.env.PORT, 4000),
  corsOrigins: str(process.env.CORS_ORIGIN, 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  mongoUri: str(process.env.MONGODB_URI, 'mongodb://127.0.0.1:27017/amazon-instant-engine'),
  mongoDbName: str(process.env.MONGODB_DB_NAME, 'amazon-instant-engine'),

  redisUrl: str(process.env.REDIS_URL, 'redis://127.0.0.1:6379'),
  bundleCacheTtlSeconds: num(process.env.BUNDLE_CACHE_TTL_SECONDS, 3600),

  llm: {
    apiKey: process.env.LLM_API_KEY ?? '',
    baseUrl: str(process.env.LLM_API_BASE_URL, 'https://api.openai.com/v1'),
    model: str(process.env.LLM_MODEL, 'gpt-4o-mini'),
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    model: str(process.env.GEMINI_MODEL, 'gemini-2.5-flash-lite'),
    baseUrl: str(process.env.GEMINI_BASE_URL, 'https://generativelanguage.googleapis.com/v1beta'),
  },

  timeouts: {
    intentParserMs: num(process.env.INTENT_PARSER_TIMEOUT_MS, 5000),
    visionMs: num(process.env.VISION_TIMEOUT_MS, 30000),
    audioIntentMs: num(process.env.AUDIO_INTENT_TIMEOUT_MS, 30000),
    llmResponseMs: num(process.env.LLM_RESPONSE_TIMEOUT_MS, 10000),
    checkoutMs: num(process.env.CHECKOUT_TIMEOUT_MS, 30000),
  },

  limits: {
    llmMaxRetries: num(process.env.LLM_MAX_RETRIES, 3),
    maxIntentChars: num(process.env.MAX_INTENT_CHARS, 500),
    intentBarCharCap: num(process.env.INTENT_BAR_CHAR_CAP, 200),
    maxImageBytes: num(process.env.MAX_IMAGE_BYTES, 10 * 1024 * 1024),
    maxAudioBytes: num(process.env.MAX_AUDIO_BYTES, 10 * 1024 * 1024),
  },

  /** When false, LLM-backed services fall back to a deterministic local stub. */
  get llmEnabled(): boolean {
    return this.llm.apiKey.trim().length > 0;
  },

  /** When false, intent->categories falls back to a local keyword matcher. */
  get geminiEnabled(): boolean {
    return this.gemini.apiKey.trim().length > 0;
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    expiresIn: str(process.env.JWT_EXPIRES_IN, '7d') as '7d' | '1d' | '24h' | '60m' | string,
  },

  bcryptSaltRounds: num(process.env.BCRYPT_SALT_ROUNDS, 10),

  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: str(process.env.GOOGLE_CALLBACK_URL, 'http://localhost:4000/api/auth/google/callback'),
  },

  // Session
  sessionSecret: str(process.env.SESSION_SECRET, 'your-session-secret-change-in-production'),
};

// Validate JWT secret at startup
if (!env.jwt.secret || env.jwt.secret.trim().length === 0) {
  throw new Error('JWT_SECRET environment variable is required for authentication');
}

export type Env = typeof env;
