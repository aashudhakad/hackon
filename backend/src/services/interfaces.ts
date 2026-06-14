import {
  AudioClip,
  Bundle,
  Catalog,
  ImageInput,
  Product,
  RequiredComponent,
  StructuredIntent,
} from '../types/domain';

/**
 * Service interfaces — the seams of the system. LLM-backed services accept
 * their LLM client as an injected dependency so they can be tested with mocks
 * (per the design's "Separation of AI from selection logic").
 */

export interface IntentParser {
  /** Requirements 7.1, 7.3, 7.4, 7.5, 7.6 — >=1 component or throws NoComponentsError. */
  parse(text: string): Promise<StructuredIntent>;
}

export interface VisionProcessor {
  /** Requirements 3.3, 7.2 — image -> text intent (1..500 chars) or throws NoIntentError. */
  analyze(image: ImageInput): Promise<string>;
}

export interface AudioIntentProcessor {
  /** Requirements 13.9, 13.10, 13.15, 13.17 — Audio_Clip -> Recognized_Intent_Text. */
  recognize(clip: AudioClip): Promise<string>;
}

export interface RankingEngine {
  /** Descending rank within a component. */
  rankAlternatives(component: RequiredComponent, products: Product[]): Product[];
  /** Highest-ranked in-stock product, else null. */
  pickDefault(ranked: Product[]): Product | null;
}

export interface ConfidenceEngine {
  /** Integer 0..100. */
  score(intent: StructuredIntent, bundle: Pick<Bundle, 'rows' | 'unfulfilledComponents'>): number;
}

export interface BundleGenerator {
  generate(intent: StructuredIntent, catalog: Catalog): Bundle;
}

export interface CrossSellEngine {
  /** 3..4 products sharing >=1 theme, or [] -> hide strip. */
  select(bundle: Bundle, catalog: Catalog): Product[];
}

/** Multi-modal LLM client abstraction (text + vision + audio). */
export interface LLMClient {
  /** Returns component names extracted from a natural-language intent. */
  extractComponents(text: string): Promise<string[]>;
  /** Returns a text intent derived from an image. */
  imageToIntentText(image: ImageInput): Promise<string>;
  /** Returns recognized text derived from an audio clip. */
  audioToIntentText(clip: AudioClip): Promise<string>;
}
