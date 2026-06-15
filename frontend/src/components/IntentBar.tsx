'use client';

import { useEffect, useState } from 'react';
import { SnapButton } from './SnapButton';
import { MicButton } from './MicButton';
import { Button } from './ui/Button';

const PLACEHOLDERS = [
  'Make paneer bhurji',
  'Office emergency kit',
  'Weekend camping trip',
  'Quick healthy snacks',
  'Restock my coffee',
];

const MAX_CHARS = 200;

interface IntentBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  /** Slots rendered inside the bar for snap/mic controls. */
  onVisionStart: () => void;
  onVisionFile: (file: File) => void;
  onRecognized: (text: string) => void;
  onError: (message: string) => void;
}

/**
 * Oversized intent input (Requirements 1.1, 1.2, 1.8-1.10, 13.11-13.13).
 * - Prompt "What are you trying to do?"
 * - Cycles >=3 placeholders every 3s while empty.
 * - Caps input at 200 chars, trims on submit, disables submit on whitespace.
 */
export function IntentBar({
  value,
  onChange,
  onSubmit,
  disabled,
  onVisionStart,
  onVisionFile,
  onRecognized,
  onError,
}: IntentBarProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (value.length > 0) return;
    const timer = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [value]);

  const canSubmit = value.trim().length > 0 && !disabled;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor="intent" className="mb-2 sm:mb-3 block text-center text-xl sm:text-2xl md:text-3xl font-semibold px-2">
        What are you trying to do?
      </label>

      <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-card transition focus-within:border-accent focus-within:ring-2 focus-within:ring-[var(--accent-ring)] sm:gap-2">
        <input
          id="intent"
          type="text"
          value={value}
          maxLength={MAX_CHARS}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
          placeholder={PLACEHOLDERS[placeholderIndex]}
          className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none disabled:opacity-60 sm:px-3 sm:py-3 sm:text-base md:text-lg"
          aria-label="Intent input"
        />

        <MicButton onRecognized={onRecognized} onError={onError} disabled={disabled} />
        <SnapButton onStart={onVisionStart} onFile={onVisionFile} disabled={disabled} />

        <Button type="submit" size="lg" disabled={!canSubmit} className="shrink-0">
          Go
        </Button>
      </div>

      <div className="mt-1 px-2 text-right text-[10px] sm:text-xs text-gray-400">
        {value.length}/{MAX_CHARS}
      </div>
    </form>
  );
}
