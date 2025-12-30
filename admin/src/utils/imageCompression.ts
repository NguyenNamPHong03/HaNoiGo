/**
 * IMAGE COMPRESSION UTILITY
 * Compress images before upload để giảm thời gian upload và bandwidth
 */

interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker?: boolean;
  quality?: number;
}

/**
 * Compress image file trước khi upload
 * @param file - File ảnh gốc
 * @param options - Compression options
 * @returns Compressed file
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    quality: 0.8
  }
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > options.maxWidthOrHeight) {
            height = Math.round((height * options.maxWidthOrHeight) / width);
            width = options.maxWidthOrHeight;
          }
        } else {
          if (height > options.maxWidthOrHeight) {
            width = Math.round((width * options.maxWidthOrHeight) / height);
            height = options.maxWidthOrHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image với quality cao
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob failed'));
              return;
            }

            // Check if compressed size is acceptable
            const compressedSizeMB = blob.size / 1024 / 1024;
            
            console.log('📊 Compression result:', {
              original: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
              compressed: `${compressedSizeMB.toFixed(2)} MB`,
              reduction: `${(((file.size - blob.size) / file.size) * 100).toFixed(1)}%`,
              dimensions: `${width}x${height}`
            });

            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          options.quality || 0.8
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Batch compress multiple images
 * @param files - Array of files
 * @param options - Compression options
 * @returns Array of compressed files
 */
export const compressImages = async (
  files: File[],
  options?: CompressionOptions
): Promise<File[]> => {
  const compressionPromises = files.map(file => compressImage(file, options));
  return Promise.all(compressionPromises);
};

/**
 * Check if file needs compression
 * @param file - File to check
 * @param maxSizeMB - Max size in MB
 * @returns Boolean
 */
export const needsCompression = (file: File, maxSizeMB: number = 1): boolean => {
  const fileSizeMB = file.size / 1024 / 1024;
  return fileSizeMB > maxSizeMB;
};

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
