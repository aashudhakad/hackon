import { env } from '../config/env';
import { logger } from '../config/logger';
import { AudioClip, ImageInput } from '../types/domain';
import { LLMClient } from './interfaces';

/**
 * Multi-modal LLM client.
 *
 * Two implementations are provided:
 *  - `StubLLMClient`: a deterministic, dependency-free local implementation used
 *    when no LLM_API_KEY is configured, so the backend is fully runnable in dev
 *    and testable without external calls.
 *  - `HttpLLMClient`: a thin REST client placeholder for a real multi-modal LLM.
 *
 * Services depend only on the `LLMClient` interface, keeping AI non-determinism
 * isolated behind a single seam (per the design's key decisions).
 */

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'for',
  'i',
  'me',
  'my',
  'need',
  'of',
  'the',
  'to',
  'want',
  'with',
  'make',
  'making',
  'some',
  'please',
  'get',
  'buy',
]);

/**
 * Extracts naive component candidates from free text by tokenizing on
 * non-word characters, dropping stopwords, and de-duplicating. Deterministic so
 * the same text always yields the same components (supports caching).
 */
function naiveComponents(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));

  const seen = new Set<string>();
  const components: string[] = [];
  for (const token of tokens) {
    if (!seen.has(token)) {
      seen.add(token);
      // Title-case for a friendlier component name.
      components.push(token.charAt(0).toUpperCase() + token.slice(1));
    }
  }
  return components;
}

export class StubLLMClient implements LLMClient {
  async extractComponents(text: string): Promise<string[]> {
    return naiveComponents(text);
  }

  async imageToIntentText(image: ImageInput): Promise<string> {
    // Deterministic placeholder intent derived from image metadata.
    const kb = Math.round(image.sizeBytes / 1024);
    return `kitchen essentials bundle (from ${image.mimeType}, ${kb}KB image)`;
  }

  async audioToIntentText(clip: AudioClip): Promise<string> {
    const seconds = Math.round(clip.durationMs / 1000);
    return `weekly grocery restock (from ${seconds}s audio clip)`;
  }
}

/**
 * Placeholder HTTP client. Wired to use the global `fetch` (Node 18+/23). The
 * exact request/response shape depends on the chosen provider; the methods
 * below throw if the remote returns no usable content so callers can apply the
 * retry policy.
 */
export class HttpLLMClient implements LLMClient {
  async extractComponents(text: string): Promise<string[]> {
    const content = await this.chat(
      'Extract the distinct required shopping components from the user intent. ' +
        'Respond with a comma-separated list of component names only.',
      text,
    );
    return content
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }

  async imageToIntentText(_image: ImageInput): Promise<string> {
    // Real vision call would upload the image; left as a guarded placeholder.
    throw new Error('HttpLLMClient.imageToIntentText not implemented for this provider');
  }

  async audioToIntentText(_clip: AudioClip): Promise<string> {
    throw new Error('HttpLLMClient.audioToIntentText not implemented for this provider');
  }

  private async chat(system: string, user: string): Promise<string> {
    const res = await fetch(`${env.llm.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.llm.apiKey}`,
      },
      body: JSON.stringify({
        model: env.llm.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0,
      }),
    });

    if (!res.ok) {
      throw new Error(`LLM HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('LLM returned empty content');
    return content;
  }
}

/** Returns the configured LLM client (HTTP when a key is present, else stub). */
export function createLLMClient(): LLMClient {
  if (env.llmEnabled) {
    logger.info('Using HTTP LLM client', { model: env.llm.model });
    return new HttpLLMClient();
  }
  logger.warn('LLM_API_KEY not set — using deterministic StubLLMClient');
  return new StubLLMClient();
}

export const llmClient: LLMClient = createLLMClient();
