'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useCart } from '@/lib/cart';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

export function Avatar({
  src,
  name = 'User',
  size = 36,
  className = '',
}: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const { mode } = useCart();

  const isFlash = mode === 'flash';

  const initial = (name.trim()[0] || 'U').toUpperCase();

  const dimension = {
    width: size,
    height: size,
  };

  if (src && !errored) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        onError={() => setErrored(true)}
        className={`rounded-full object-cover ring-2 ring-white shadow-sm ${className}`}
        style={dimension}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className={`flex items-center justify-center rounded-full font-bold text-white shadow-sm ${
        isFlash
          ? 'bg-gradient-to-br from-red-600 to-red-700'
          : 'bg-gradient-to-br from-emerald-500 to-teal-600'
      } ${className}`}
      style={{
        ...dimension,
        fontSize: Math.round(size * 0.42),
      }}
      aria-label={name}
    >
      {initial}
    </span>
  );
}