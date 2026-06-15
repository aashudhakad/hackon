'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';
type Tone = 'accent' | 'flash';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Forces the color family. `accent` follows the active theme; `flash` is always red. */
  tone?: Tone;
  fullWidth?: boolean;
  loading?: boolean;
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
};

/** Resolves variant + tone into Tailwind classes. */
function styles(variant: Variant, tone: Tone): string {
  const accent =
    tone === 'flash'
      ? {
          primary: 'bg-flash-600 text-white hover:bg-flash-700 shadow-sm',
          outline: 'border border-flash-600 text-flash-600 hover:bg-flash-50',
          ghost: 'text-flash-600 hover:bg-flash-50',
        }
      : {
          primary: 'bg-accent text-accent-fg hover:bg-accent-strong shadow-sm',
          outline: 'border border-accent text-accent hover:bg-accent-soft',
          ghost: 'text-accent hover:bg-accent-soft',
        };

  switch (variant) {
    case 'primary':
      return accent.primary;
    case 'outline':
      return accent.outline;
    case 'ghost':
      return accent.ghost;
    case 'secondary':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    case 'danger':
      return 'bg-red-600 text-white hover:bg-red-700 shadow-sm';
    default:
      return accent.primary;
  }
}

/**
 * App-wide button primitive. Theme-reactive (`tone="accent"` follows Quick/Flash
 * via CSS variables), large touch targets (md/lg ≥ h-11/h-12), and a built-in
 * loading spinner.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', tone = 'accent', fullWidth, loading, className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${styles(variant, tone)} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
});
