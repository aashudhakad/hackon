'use client';

import Image from 'next/image';
import { useState } from 'react';

interface AvatarProps {
  /** Profile picture URL (e.g. Google `profilePicture`). */
  src?: string | null;
  /** Used to derive the fallback initial and alt text. */
  name?: string;
  size?: number;
  className?: string;
}

/**
 * User avatar. Renders the profile picture via next/image and gracefully falls
 * back to a gradient circle with the user's initial when the image is missing
 * or fails to load.
 */
export function Avatar({ src, name = 'User', size = 36, className = '' }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const initial = (name.trim()[0] || 'U').toUpperCase();
  const dimension = { width: size, height: size };

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
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 font-bold text-white shadow-sm ${className}`}
      style={{ ...dimension, fontSize: Math.round(size * 0.42) }}
      aria-label={name}
    >
      {initial}
    </span>
  );
}
