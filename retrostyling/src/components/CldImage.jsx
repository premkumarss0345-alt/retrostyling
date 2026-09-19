import React from 'react';
import { getOptimizedCloudinaryUrl } from '../services/cloudinaryService';

/**
 * Cloudinary Optimized Image Component
 * Applies automatic WebP/AVIF format selection, auto-quality, responsive scaling, and lazy loading.
 */
export function CldImage({
  src,
  alt = 'Product image',
  width,
  height,
  crop = 'auto',
  className = '',
  loading = 'lazy',
  decoding = 'async',
  style = {},
  ...props
}) {
  if (!src) return null;

  // If already a full URL or Cloudinary public id
  let fullUrl = src;
  if (!src.startsWith('http') && !src.startsWith('/')) {
    fullUrl = `https://res.cloudinary.com/ckdk9sbc/image/upload/${src}`;
  }

  const optimizedSrc = getOptimizedCloudinaryUrl(fullUrl, {
    width,
    height,
    crop: typeof crop === 'object' ? crop.type || 'auto' : crop,
    quality: 'auto',
    format: 'auto',
  });

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      className={className}
      style={{ objectFit: 'cover', ...style }}
      {...props}
    />
  );
}

export default CldImage;
