import { CategoryRow } from '../types/domain';

/**
 * Explanation generation and confidence-driven UI flags (Task 8.1).
 *
 * Property 24 (Requirements 10.1, 10.2): an explanation naming every fulfilled
 * required component is produced when confidence >= 1, and omitted (null) when
 * confidence == 0.
 * Property 25 (Requirements 10.4, 10.5): the low-confidence notice flag is true
 * for scores 0..49 and false for 50..100.
 */

/** Names of components that have a Selected_Item (fulfilled rows). */
export function fulfilledComponentNames(rows: CategoryRow[]): string[] {
  return rows.filter((r) => r.selectedItemId !== null).map((r) => r.component.name);
}

export function buildExplanation(rows: CategoryRow[], confidence: number): string | null {
  if (confidence < 1) return null;

  const names = fulfilledComponentNames(rows);
  if (names.length === 0) {
    // Defensive: a non-zero confidence with no fulfilled rows still yields a
    // minimal explanation rather than null.
    return 'This bundle was assembled for your intent.';
  }

  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

  return `This bundle covers ${list} to address your intent.`;
}

/** True when the low-confidence review notice should be shown (0..49). */
export function isLowConfidence(confidence: number): boolean {
  return confidence >= 0 && confidence <= 49;
}
