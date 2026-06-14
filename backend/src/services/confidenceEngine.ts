import { Bundle, StructuredIntent } from '../types/domain';
import { ConfidenceEngine } from './interfaces';

/**
 * Confidence scoring (Task 4.1).
 *
 * Property 21 (Requirement 8.4): score is an integer in [0, 100].
 *
 * Heuristic: confidence is the proportion of required components that were
 * fulfilled (have an in-stock Selected_Item), expressed as an integer percent.
 * An intent with no components scores 0.
 */
export const confidenceEngine: ConfidenceEngine = {
  score(intent: StructuredIntent, bundle: Pick<Bundle, 'rows' | 'unfulfilledComponents'>): number {
    const total = intent.components.length;
    if (total === 0) return 0;

    const fulfilled = bundle.rows.filter((r) => r.selectedItemId !== null).length;
    const ratio = fulfilled / total;
    const value = Math.round(ratio * 100);

    // Clamp defensively into [0, 100].
    return Math.max(0, Math.min(100, value));
  },
};
