/**
 * Domain-specific error types. Each carries an HTTP status and a stable
 * `code` so controllers/middleware can shape consistent error responses
 * that preserve the user's state (per the design's Error Handling section).
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  /** Optional payload echoed back to the client (e.g. retained text). */
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, new.target);
  }
}

/** Intent text exceeds the 500-character maximum (Requirement 7.5). */
export class IntentTooLongError extends AppError {
  constructor(rawText: string) {
    super('Intent exceeds the maximum allowed length of 500 characters.', 400, 'INTENT_TOO_LONG', {
      rawText,
    });
  }
}

/** Intent is empty/whitespace-only (Requirement 1.8). */
export class EmptyIntentError extends AppError {
  constructor() {
    super('Intent must contain at least one non-whitespace character.', 400, 'EMPTY_INTENT');
  }
}

/** The parser could not extract any required components (Requirement 7.3). */
export class NoComponentsError extends AppError {
  constructor(rawText: string) {
    super('Could not identify any required components. Please be more specific.', 422, 'NO_COMPONENTS', {
      rawText,
    });
  }
}

/** The vision processor could not derive an intent from the image (Requirement 3.8). */
export class NoIntentError extends AppError {
  constructor() {
    super('No items were recognized in the image.', 422, 'NO_INTENT');
  }
}

/** Recognized text was empty/whitespace-only (Requirement 13.15). */
export class NoSpeechError extends AppError {
  constructor() {
    super('No speech was recognized.', 422, 'NO_SPEECH');
  }
}

/** Unsupported image format or oversize image (Requirement 3.7). */
export class UnsupportedImageError extends AppError {
  constructor(message = 'Unsupported image. Supported formats are JPEG and PNG up to 5 MB.') {
    super(message, 400, 'UNSUPPORTED_IMAGE');
  }
}

/** Audio clip failed duration/size bounds (Requirements 13.7, 13.18, 13.20). */
export class InvalidAudioError extends AppError {
  constructor(message: string, code = 'INVALID_AUDIO') {
    super(message, 400, code);
  }
}

/** Parser exceeded its 5s budget (Requirement 7.6). */
export class ParserTimeoutError extends AppError {
  constructor() {
    super('Intent could not be processed in time.', 504, 'PARSER_TIMEOUT');
  }
}

/** Vision processing exceeded its 30s budget (Requirement 3.9). */
export class VisionTimeoutError extends AppError {
  constructor() {
    super('Image analysis timed out.', 504, 'VISION_TIMEOUT');
  }
}

/** Audio intent processing exceeded its 30s budget (Requirement 13.17). */
export class AudioTimeoutError extends AppError {
  constructor() {
    super('Audio could not be processed in time.', 504, 'AUDIO_TIMEOUT');
  }
}

/** LLM error or exhausted retries (Requirements 11.1, 11.6). */
export class LLMUnavailableError extends AppError {
  constructor(message = 'The request could not be completed. Please try again.') {
    super(message, 503, 'LLM_UNAVAILABLE');
  }
}

/** Generic not-found for catalog/bundle/smart-bundle lookups. */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(message, 404, 'NOT_FOUND');
  }
}

/** Empty cart at checkout (Requirement 12.3). */
export class EmptyCartError extends AppError {
  constructor() {
    super('The cart is empty.', 400, 'EMPTY_CART');
  }
}
