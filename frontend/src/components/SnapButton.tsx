'use client';

import { useRef } from 'react';

const SUPPORTED = ['image/jpeg', 'image/png'];
const MAX_BYTES = 10 * 1024 * 1024;

interface SnapButtonProps {
  onStart: () => void;
  onFile: (file: File) => void;
  disabled?: boolean;
}

/**
 * Snap_Icon (Requirements 3.1, 3.7). Opens a file picker restricted to
 * JPEG/PNG and validates the 10 MB limit client-side before handing off.
 */
export function SnapButton({ onStart, onFile, disabled }: SnapButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    if (!SUPPORTED.includes(file.type)) {
      alert('Supported image formats are JPEG and PNG (max 10 MB).');
      return;
    }
    if (file.size > MAX_BYTES) {
      alert('Image exceeds the 10 MB maximum size.');
      return;
    }
    onStart();
    onFile(file);
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        title="Snap a photo"
        aria-label="Snap a photo"
        className="rounded-xl p-3 text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </>
  );
}
