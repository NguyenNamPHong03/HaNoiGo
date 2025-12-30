import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * UPLOAD SERVICE
 * Business logic layer cho file uploads
 * Xử lý: Cloudinary upload, Local storage fallback, Image optimization
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== CLOUDINARY CONFIGURATION ==========

/**
 * Check if Cloudinary is configured
 * @returns {boolean} Is configured
 */
export const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Initialize Cloudinary configuration
 */
export const initCloudinary = () => {
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('✅ Cloudinary configured successfully');
  } else {
    console.log('⚠️ Cloudinary not configured - using local storage fallback');
  }
};

// ========== STORAGE CONFIGURATION ==========

/**
 * Get folder path for upload type
 */
const getFolderPath = (uploadType) => {
  const folderMap = {
    avatars: 'hanoigo/avatars',
    places: 'hanoigo/places',
    reviews: 'hanoigo/reviews',
  };
  return folderMap[uploadType] || folderMap.avatars;
};

/**
 * Get transformation settings for upload type
 */
const getTransformation = (uploadType) => {
  const transformMap = {
    avatars: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' },
    ],
    places: [
      { width: 800, height: 600, crop: 'limit', quality: 'auto' },
    ],
    reviews: [
      { width: 600, height: 600, crop: 'limit', quality: 'auto' },
    ],
  };
  return transformMap[uploadType] || transformMap.avatars;
};

/**
 * Create Cloudinary storage
 */
const createCloudinaryStorage = (uploadType) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: getFolderPath(uploadType),
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: getTransformation(uploadType),
    },
  });
};

/**
 * Create local disk storage (fallback)
 */
const createLocalStorage = (uploadType) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, `../uploads/${uploadType}`);

      // Create directory if not exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log(`📁 Created directory: ${uploadPath}`);
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });
};

/**
 * Create storage configuration based on environment
 */
export const createStorage = (uploadType = 'avatars') => {
  if (isCloudinaryConfigured()) {
    console.log(`✅ Using Cloudinary storage for ${uploadType}`);
    return createCloudinaryStorage(uploadType);
  } else {
    console.log(`⚠️ Using local storage for ${uploadType}`);
    return createLocalStorage(uploadType);
  }
};

// ========== MULTER UPLOAD INSTANCES ==========

/**
 * Create multer upload instance for avatars
 */
export const createAvatarUpload = () => {
  return multer({
    storage: createStorage('avatars'),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  });
};

/**
 * Create multer upload instance for place images
 */
export const createPlaceImagesUpload = () => {
  return multer({
    storage: createStorage('places'),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per image
      files: 10, // Max 10 files
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  });
};

// ========== FILE PROCESSING ==========

/**
 * Process uploaded file and return URL
 * @param {object} file - Multer file object
 * @param {object} req - Express request (for local URL construction)
 * @returns {string} File URL
 */
export const processUploadedFile = (file, req) => {
  if (!file) {
    throw new Error('No file provided');
  }

  // Check if Cloudinary URL
  const isCloudinaryUrl =
    file.path && file.path.includes('cloudinary.com');

  if (isCloudinaryUrl) {
    // Return Cloudinary URL
    return file.path;
  } else {
    // Construct local URL
    const uploadType = file.destination.split('/').pop();
    return `${req.protocol}://${req.get('host')}/uploads/${uploadType}/${
      file.filename
    }`;
  }
};

/**
 * Process multiple uploaded files
 * @param {array} files - Array of multer file objects
 * @param {object} req - Express request
 * @returns {array} Array of file URLs
 */
export const processMultipleFiles = (files, req) => {
  if (!files || files.length === 0) {
    return [];
  }

  return files.map((file) => processUploadedFile(file, req));
};

// ========== CLOUDINARY DIRECT UPLOAD ==========

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Cloudinary folder
 * @param {object} options - Upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
export const uploadToCloudinary = (buffer, folder = 'hanoigo', options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      reject(new Error('Cloudinary is not configured'));
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Upload image from URL to Cloudinary
 * @param {string} imageUrl - Image URL
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<object>} Cloudinary upload result
 */
export const uploadUrlToCloudinary = async (imageUrl, folder = 'hanoigo') => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const result = await cloudinary.uploader.upload(imageUrl, {
    folder,
  });

  return result;
};

// ========== DELETE OPERATIONS ==========

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} Delete result
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};

/**
 * Delete local file
 * @param {string} filePath - File path
 */
export const deleteLocalFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ Deleted local file: ${filePath}`);
  }
};

/**
 * Extract Cloudinary public ID from URL
 * @param {string} url - Cloudinary URL
 * @returns {string} Public ID
 */
export const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  // Extract public_id from URL
  // Example: https://res.cloudinary.com/demo/image/upload/v1234/hanoigo/avatars/abc.jpg
  // Public ID: hanoigo/avatars/abc
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;

  const pathParts = parts[1].split('/');
  // Remove version (v1234) if exists
  const startIndex = pathParts[0].startsWith('v') ? 1 : 0;

  // Remove file extension
  const publicIdParts = pathParts.slice(startIndex);
  const lastPart = publicIdParts[publicIdParts.length - 1];
  publicIdParts[publicIdParts.length - 1] = lastPart.split('.')[0];

  return publicIdParts.join('/');
};

/**
 * Delete image from Cloudinary or local storage
 * @param {string} imageUrl - Image URL
 */
export const deleteImage = async (imageUrl) => {
  if (!imageUrl) {
    return;
  }

  // Check if Cloudinary URL
  if (imageUrl.includes('cloudinary.com')) {
    const publicId = extractPublicId(imageUrl);
    if (publicId) {
      await deleteFromCloudinary(publicId);
      console.log(`🗑️ Deleted from Cloudinary: ${publicId}`);
    }
  } else {
    // Local file
    const filename = imageUrl.split('/').pop();
    const uploadType = imageUrl.split('/').slice(-2, -1)[0];
    const filePath = path.join(
      __dirname,
      `../uploads/${uploadType}/${filename}`
    );
    deleteLocalFile(filePath);
  }
};

// ========== VALIDATION ==========

/**
 * Validate image file
 * @param {object} file - File object
 * @returns {boolean} Is valid
 */
export const isValidImage = (file) => {
  if (!file) {
    return false;
  }

  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  return allowedMimeTypes.includes(file.mimetype);
};

/**
 * Validate file size
 * @param {object} file - File object
 * @param {number} maxSize - Max size in bytes
 * @returns {boolean} Is valid
 */
export const isValidFileSize = (file, maxSize = 5 * 1024 * 1024) => {
  if (!file) {
    return false;
  }

  return file.size <= maxSize;
};

/**
 * Get file extension from mimetype
 * @param {string} mimetype - File mimetype
 * @returns {string} Extension
 */
export const getExtensionFromMimetype = (mimetype) => {
  const mimetypeMap = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  };

  return mimetypeMap[mimetype] || '.jpg';
};

// ========== OPTIMIZATION ==========

/**
 * Get optimized image URL from Cloudinary
 * @param {string} url - Original Cloudinary URL
 * @param {object} options - Transformation options
 * @returns {string} Optimized URL
 */
export const getOptimizedUrl = (url, options = {}) => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const { width, height, quality = 'auto', format = 'auto' } = options;

  let transformation = `q_${quality},f_${format}`;

  if (width) {
    transformation += `,w_${width}`;
  }

  if (height) {
    transformation += `,h_${height}`;
  }

  // Insert transformation after /upload/
  return url.replace('/upload/', `/upload/${transformation}/`);
};

// Initialize Cloudinary when module loads
initCloudinary();
