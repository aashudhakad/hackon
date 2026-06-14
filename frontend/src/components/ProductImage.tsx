'use client';

import { useState } from 'react';
import { CategoryIcon } from './CategoryIcon';

interface ProductImageProps {
  src?: string;
  alt: string;
  category?: string;
  brand?: string;
  className?: string;
}

/**
 * ProductImage component with automatic fallback to category icon
 * when image is missing or fails to load.
 * Optimized for fast loading - shows fallback immediately if no src.
 */
export function ProductImage({ src, alt, category = '', brand = '', className = '' }: ProductImageProps) {
  const [imageError, setImageError] = useState(false);

  // If no image URL, show category icon immediately (no loading state)
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${className}`}>
        <CategoryIcon category={category} className="w-1/2 h-1/2 text-gray-400" />
      </div>
    );
  }

  // If image failed to load, show category icon
  if (imageError) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${className}`}>
        <CategoryIcon category={category} className="w-1/2 h-1/2 text-gray-400" />
      </div>
    );
  }

  // Show image with error handling
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
}
