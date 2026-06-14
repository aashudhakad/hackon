import { env } from '../config/env';
import { NoComponentsError, ParserTimeoutError } from '../errors';
import { RequiredComponent, StructuredIntent } from '../types/domain';
import { withTimeout } from '../utils/async';
import { validateAndPrepareIntent } from './intentNormalization';
import { IntentParser, LLMClient } from './interfaces';
import { llmClient as defaultLLM } from './llmClient';

/**
 * Intent parsing handoff (Task 2.4).
 *
 * Orchestrates the LLM call to produce a StructuredIntent with >= 1 component
 * for valid 1..500-char input (Property 17, Requirement 7.1), rejects
 * over-length intents (Requirement 7.5, via validateAndPrepareIntent), throws
 * NoComponentsError when none are found (Requirement 7.3), and enforces the 5s
 * extraction budget (Requirement 7.6).
 *
 * The LLM is injected so tests can exercise the handoff with a mock.
 */
export function createIntentParser(llm: LLMClient = defaultLLM): IntentParser {
  return {
    async parse(text: string): Promise<StructuredIntent> {
      const rawText = validateAndPrepareIntent(text);

      const names = await withTimeout(
        llm.extractComponents(rawText),
        env.timeouts.intentParserMs,
        () => new ParserTimeoutError(),
      );

      const components = toComponents(names);
      if (components.length === 0) {
        throw new NoComponentsError(rawText);
      }

      return { rawText, components };
    },
  };
}

/** Maps de-duplicated component names to ordered RequiredComponents. */
function toComponents(names: string[]): RequiredComponent[] {
  const seen = new Set<string>();
  const components: RequiredComponent[] = [];
  let sequence = 0;
  for (const raw of names) {
    const name = raw.trim();
    const key = name.toLowerCase();
    if (name.length === 0 || seen.has(key)) continue;
    seen.add(key);
    components.push({
      name,
      sequence: sequence++,
      themes: [key],
    });
  }
  return components;
}

export const intentParser: IntentParser = createIntentParser();
