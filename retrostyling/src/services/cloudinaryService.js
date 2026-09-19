/**
 * Cloudinary Direct Signed Storage & Optimization Service
 * Cloud Name: ckdk9sbc
 */

export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'ckdk9sbc',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '898479282538369',
  apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET || '4JmwMMSy2ZeczACTPeKR-iWIQCQ',
  uploadPreset: 'ml_default',
};

/**
 * Generate SHA-1 hex hash using Web Crypto API in browser.
 */
async function computeSha1(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload an image file directly to Cloudinary Storage using authenticated signed upload with preset ml_default.
 * @param {File|Blob|string} file - The file to upload
 * @param {string} folder - Destination folder on Cloudinary (default: 'retrostyling/products')
 * @returns {Promise<{ url: string, public_id: string, format: string, width: number, height: number }>}
 */
export async function uploadToCloudinary(file, folder = 'retrostyling/products') {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const { cloudName, apiKey, apiSecret, uploadPreset } = CLOUDINARY_CONFIG;

  // 1. Direct Signed Upload with upload_preset ml_default
  try {
    // Alphabetical order of parameters for signing: folder, timestamp, upload_preset
    const stringToSign = `folder=${folder}&timestamp=${timestamp}&upload_preset=${uploadPreset}${apiSecret}`;
    const signature = await computeSha1(stringToSign);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('folder', folder);
    formData.append('upload_preset', uploadPreset);
    formData.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return {
        url: data.secure_url || data.url,
        public_id: data.public_id,
        format: data.format,
        width: data.width,
        height: data.height,
      };
    } else {
      const errJson = await res.json().catch(() => ({}));
      console.warn('Direct signed Cloudinary upload response not OK:', errJson);
    }
  } catch (directErr) {
    console.warn('Direct signed Cloudinary upload error:', directErr);
  }

  // 2. Fallback: Backend Express route (/api/upload/cloudinary)
  try {
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('folder', folder);

    const backendRes = await fetch('/api/upload/cloudinary', {
      method: 'POST',
      body: backendFormData,
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
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
    console.warn('Backend Cloudinary upload route failed:', backendErr);
  }

  throw new Error('Unable to upload image to Cloudinary. Please check your network connection.');
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
