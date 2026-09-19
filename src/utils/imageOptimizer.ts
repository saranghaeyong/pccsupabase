/**
 * Utility for client-side image validation, optimization, and preparation for Supabase Storage.
 */

export interface OptimizedImage {
  file: File;
  previewUrl: string;
  originalSize: number;
  optimizedSize: number;
  mimeType: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB limit

export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'Please choose an image file.' };
  }

  const type = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(type)) {
    return {
      isValid: false,
      error: 'Unsupported format. Allowed formats: JPG, JPEG, PNG, WEBP.'
    };
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return {
      isValid: false,
      error: 'Image exceeds 10MB limit. Please select a smaller photo.'
    };
  }

  return { isValid: true };
}

/**
 * Optimizes an image before uploading to Supabase Storage:
 * - Resizes dimensions exceeding max bounds (max 1200x1500)
 * - Compresses slightly to reduce network payload and accelerate upload
 * - Returns a File and preview object URL
 */
export async function optimizeImageForUpload(
  file: File,
  maxWidth = 1200,
  maxHeight = 1500,
  quality = 0.85
): Promise<OptimizedImage> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // If already within bounds and under 1.5MB, use original file directly
        if (width <= maxWidth && height <= maxHeight && originalSize < 1.5 * 1024 * 1024) {
          const previewUrl = URL.createObjectURL(file);
          resolve({
            file,
            previewUrl,
            originalSize,
            optimizedSize: originalSize,
            mimeType: file.type
          });
          return;
        }

        // Scale proportionally
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const previewUrl = URL.createObjectURL(file);
          resolve({
            file,
            previewUrl,
            originalSize,
            optimizedSize: originalSize,
            mimeType: file.type
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              const previewUrl = URL.createObjectURL(file);
              resolve({
                file,
                previewUrl,
                originalSize,
                optimizedSize: originalSize,
                mimeType: file.type
              });
              return;
            }

            const extension = outputType === 'image/png' ? 'png' : 'jpg';
            const optimizedFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
            const optimizedFile = new File([blob], optimizedFileName, { type: outputType });
            const previewUrl = URL.createObjectURL(blob);

            resolve({
              file: optimizedFile,
              previewUrl,
              originalSize,
              optimizedSize: blob.size,
              mimeType: outputType
            });
          },
          outputType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Unable to process the selected image file.'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file.'));
    };
  });
}

/**
 * Converts a file to an optimized, lightweight base64 Data URL (JPEG/WebP)
 * Used as a seamless fallback when Supabase Storage RLS restricts direct uploads.
 */
export async function optimizeImageToDataUrl(
  file: File,
  maxWidth = 800,
  maxHeight = 1000,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale proportionally to portrait bounding box
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compact JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        // Fallback to raw data url if canvas rendering fails
        resolve(e.target?.result as string);
      };
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file as data URL.'));
    };
  });
}

