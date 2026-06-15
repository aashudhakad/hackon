'use client';

import { Minus, Plus } from 'lucide-react';

type Tone = 'accent' | 'flash';
type Size = 'sm' | 'md';

interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  tone?: Tone;
  size?: Size;
  /** Stop click propagation (useful inside clickable cards). */
  stopPropagation?: boolean;
  className?: string;
}

const SIZES: Record<Size, { box: string; icon: number; text: string }> = {
  sm: { box: 'h-7 w-7', icon: 13, text: 'text-xs w-6' },
  md: { box: 'h-9 w-9', icon: 16, text: 'text-sm w-8' },
};

/**
 * Solid, theme-tinted quantity stepper ([ − n + ]) in the Blinkit/Zepto style.
 * `tone="accent"` follows the active theme; `tone="flash"` is always red.
 */
export function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  tone = 'accent',
  size = 'md',
  stopPropagation,
  className = '',
}: QuantityStepperProps) {
  const s = SIZES[size];
  const toneClass =
    tone === 'flash' ? 'bg-flash-600 text-white' : 'bg-accent text-accent-fg';

  const wrap = (fn: () => void) => (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    fn();
  };

  return (
    <div
      className={`inline-flex items-center justify-between rounded-lg ${toneClass} ${className}`}
    >
      <button
        type="button"
        onClick={wrap(onDecrement)}
        aria-label="Decrease quantity"
        className={`flex ${s.box} items-center justify-center rounded-lg transition active:scale-90`}
      >
        <Minus size={s.icon} strokeWidth={2.5} />
      </button>
      <span className={`text-center font-bold ${s.text}`}>{quantity}</span>
      <button
        type="button"
        onClick={wrap(onIncrement)}
        aria-label="Increase quantity"
        className={`flex ${s.box} items-center justify-center rounded-lg transition active:scale-90`}
      >
        <Plus size={s.icon} strokeWidth={2.5} />
      </button>
    </div>
  );
}
