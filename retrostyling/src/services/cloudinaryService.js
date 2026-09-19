/**
 * Cloudinary Image Storage & Optimization Service
 * Cloud Name: ckdk9sbc
 */

export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'ckdk9sbc',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '898479282538369',
};

/**
 * Upload an image file to Cloudinary Storage.
 * @param {File} file - The file object to upload
 * @param {string} folder - Destination folder on Cloudinary (default: 'retrostyling/products')
 * @returns {Promise<{ url: string, public_id: string }>}
 */
export async function uploadToCloudinary(file, folder = 'retrostyling/products') {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  // 1. Try uploading via Backend Express endpoint (/api/upload/cloudinary)
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch('/api/upload/cloudinary', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return {
          url: data.url,
          public_id: data.public_id,
          format: data.format,
          width: data.width,
          height: data.height,
        };
      }
    }
  } catch (backendErr) {
    console.warn('Backend Cloudinary upload route unavailable, trying direct upload:', backendErr);
  }

  // 2. Direct Cloudinary REST Upload fallback
  const directFormData = new FormData();
  directFormData.append('file', file);
  directFormData.append('upload_preset', 'ml_default');
  directFormData.append('folder', folder);

  const directRes = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
    {
      method: 'POST',
      body: directFormData,
    }
  );

  if (!directRes.ok) {
    const errData = await directRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Failed to upload image to Cloudinary');
  }

  const directData = await directRes.json();
  return {
    url: directData.secure_url || directData.url,
    public_id: directData.public_id,
    format: directData.format,
    width: directData.width,
    height: directData.height,
  };
}

/**
 * Transform a Cloudinary URL with auto format, quality, dimensions, and cropping.
 * @param {string} url - Original image URL
 * @param {object} options - Transformation options { width, height, crop, quality, format }
 * @returns {string} Transformed Cloudinary URL
 */
export function getOptimizedCloudinaryUrl(url, options = {}) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return url;
  }

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;

  const transformations = [];
  if (format) transformations.push(`f_${format}`);
  if (quality) transformations.push(`q_${quality}`);
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop && (width || height)) transformations.push(`c_${crop}`);

  if (transformations.length === 0) return url;

  const transformString = transformations.join(',');

  return url.replace('/image/upload/', `/image/upload/${transformString}/`);
}
