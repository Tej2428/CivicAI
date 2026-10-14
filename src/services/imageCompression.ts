import { COMPRESSED_IMAGE_MAX_DIMENSION, COMPRESSED_IMAGE_QUALITY } from '../constants/civicConstants';

export interface CompressionResult {
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  width: number;
  height: number;
}

/**
 * Compresses an image File or Data URL to optimized dimensions and quality.
 * Prevents localStorage quota exhaustion and reduces network payloads by ~90-95%.
 */
export async function compressImage(
  fileOrDataUrl: File | string,
  maxDimension = COMPRESSED_IMAGE_MAX_DIMENSION,
  quality = COMPRESSED_IMAGE_QUALITY
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    let originalSize = 0;
    let srcUrl = '';

    if (typeof fileOrDataUrl === 'string') {
      srcUrl = fileOrDataUrl;
      originalSize = Math.round((fileOrDataUrl.length * 3) / 4);
    } else {
      srcUrl = URL.createObjectURL(fileOrDataUrl);
      originalSize = fileOrDataUrl.size;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to acquire 2D canvas context for compression.');
        }

        // Draw image with smooth downscaling
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);

        if (typeof fileOrDataUrl !== 'string') {
          URL.revokeObjectURL(srcUrl);
        }

        resolve({
          dataUrl: compressedDataUrl,
          originalSizeBytes: originalSize,
          compressedSizeBytes: compressedSize,
          width,
          height,
        });
      } catch (err) {
        if (typeof fileOrDataUrl !== 'string') {
          URL.revokeObjectURL(srcUrl);
        }
        reject(err);
      }
    };

    img.onerror = () => {
      if (typeof fileOrDataUrl !== 'string') {
        URL.revokeObjectURL(srcUrl);
      }
      reject(new Error('Failed to decode image for compression.'));
    };

    img.src = srcUrl;
  });
}
