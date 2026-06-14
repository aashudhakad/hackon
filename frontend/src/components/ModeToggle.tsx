'use client';

import { BoltIcon } from './icons';

export type Mode = 'quick' | 'flash';

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

/**
 * Quick / Flash mode switcher. Acts as the app theme switch: Quick = calm teal
 * Category-Grid experience, Flash = high-energy red 3-basket experience.
 */
export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange('quick')}
        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
          mode === 'quick' ? 'text-white shadow' : 'text-gray-500 hover:text-gray-700'
        }`}
        style={mode === 'quick' ? { backgroundColor: 'var(--accent)' } : undefined}
      >
        Quick
      </button>
      <button
        type="button"
        onClick={() => onChange('flash')}
        className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
          mode === 'flash' ? 'bg-red-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <BoltIcon className={`h-3.5 w-3.5 ${mode === 'flash' ? 'flash-bolt' : ''}`} />
        Flash
      </button>
    </div>
  );
}
