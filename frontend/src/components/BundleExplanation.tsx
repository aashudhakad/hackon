'use client';

import { Bundle } from '@/lib/types';

/**
 * BundleExplanation (Requirements 10.1, 10.2, 10.4, 10.5).
 * - Shows the explanation when confidence >= 1 (omits when 0).
 * - Shows a low-confidence review notice for scores 0-49.
 */
export function BundleExplanation({ bundle }: { bundle: Bundle }) {
  return (
    <div className="space-y-3">
      {bundle.confidence >= 1 && bundle.explanation && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">{bundle.explanation}</p>
            <span className="ml-3 shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
              {bundle.confidence}% match
            </span>
          </div>
          {bundle.unfulfilledComponents.length > 0 && (
            <p className="mt-2 text-xs text-amber-600">
              Couldn&apos;t find: {bundle.unfulfilledComponents.join(', ')}
            </p>
          )}
        </div>
      )}

      {bundle.lowConfidence && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          This bundle has low confidence. Please review and refine your selections before checkout.
        </div>
      )}
    </div>
  );
}
