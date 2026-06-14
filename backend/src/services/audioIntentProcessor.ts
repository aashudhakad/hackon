import { env } from '../config/env';
import { AudioTimeoutError, InvalidAudioError, NoSpeechError } from '../errors';
import { AudioClip } from '../types/domain';
import { withTimeout } from '../utils/async';
import { AudioIntentProcessor, LLMClient } from './interfaces';
import { llmClient as defaultLLM } from './llmClient';

/**
 * Server-side audio intent processing (Task 11.7).
 *
 * Forwards the Audio_Clip to the multi-modal LLM and returns non-empty trimmed
 * Recognized_Intent_Text (Requirements 13.9, 13.10). Rejects clips > 10 MB,
 * throws AudioTimeoutError after 30s (Requirement 13.17), and throws
 * NoSpeechError for empty/whitespace results (Requirement 13.15).
 */
export function createAudioIntentProcessor(llm: LLMClient = defaultLLM): AudioIntentProcessor {
  return {
    async recognize(clip: AudioClip): Promise<string> {
      if (clip.sizeBytes > env.limits.maxAudioBytes) {
        throw new InvalidAudioError(
          'The recording exceeded the maximum allowed size of 10 MB.',
          'AUDIO_OVERSIZE',
        );
      }

      const text = await withTimeout(
        llm.audioToIntentText(clip),
        env.timeouts.audioIntentMs,
        () => new AudioTimeoutError(),
      );

      const trimmed = text.trim();
      if (trimmed.length === 0) {
        throw new NoSpeechError();
      }
      return trimmed;
    },
  };
}

export const audioIntentProcessor: AudioIntentProcessor = createAudioIntentProcessor();
