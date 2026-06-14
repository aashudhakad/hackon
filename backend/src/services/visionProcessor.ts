import { env } from '../config/env';
import { NoIntentError, VisionTimeoutError } from '../errors';
import { ImageInput } from '../types/domain';
import { withTimeout } from '../utils/async';
import { LLMClient, VisionProcessor } from './interfaces';
import { llmClient as defaultLLM } from './llmClient';

/**
 * Vision processing (Task 10.3).
 *
 * Converts image -> text intent (1..500 chars) via the multi-modal LLM
 * (Requirements 3.3, 7.2). The produced text is then fed into the same
 * IntentParser by the controller, so downstream handling is identical to typed
 * intent. Throws NoIntentError when no intent is derived (Requirement 3.8) and
 * enforces the 30s analysis budget (Requirement 3.9).
 */
export function createVisionProcessor(llm: LLMClient = defaultLLM): VisionProcessor {
  return {
    async analyze(image: ImageInput): Promise<string> {
      const text = await withTimeout(
        llm.imageToIntentText(image),
        env.timeouts.visionMs,
        () => new VisionTimeoutError(),
      );

      const trimmed = text.trim();
      if (trimmed.length === 0 || trimmed.length > env.limits.maxIntentChars) {
        throw new NoIntentError();
      }
      return trimmed;
    },
  };
}

export const visionProcessor: VisionProcessor = createVisionProcessor();
