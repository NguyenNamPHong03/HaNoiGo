import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to check Cloudinary configuration (called dynamically)
const checkCloudinaryConfig = () => {
  const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                      process.env.CLOUDINARY_API_KEY && 
                      process.env.CLOUDINARY_API_SECRET;
  
  console.log('🔍 Cloudinary Config Check:');
  console.log('- CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('- API_KEY:', process.env.CLOUDINARY_API_KEY?.substring(0, 5) + '...');
  console.log('- API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');
  console.log('- isCloudinaryConfigured:', isConfigured);
  
  return isConfigured;
};

// Create storage configuration function
const createStorage = () => {
  const isCloudinaryConfigured = checkCloudinaryConfig();
  
  if (isCloudinaryConfigured) {
  console.log('✅ Using Cloudinary storage');
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

    // Configure Cloudinary storage for Multer
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'hanoigo/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' }
        ]
      }
    });
} else {
  console.log('⚠️ Using LOCAL storage (Cloudinary not configured)');
  // Fallback to local storage
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/avatars');
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });
  }
};

// Create multer upload middleware with dynamic storage
export const uploadAvatar = multer({
  storage: createStorage(), // Use dynamic storage function
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload avatar controller
export const uploadAvatarController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    let avatarUrl;
    
    // Debug log
    console.log('Cloudinary configured:', isCloudinaryConfigured);
    console.log('File info:', {
      filename: req.file.filename,
      path: req.file.path,
      originalname: req.file.originalname
    });
    
    if (isCloudinaryConfigured) {
      // Cloudinary URL
      avatarUrl = req.file.path;
      console.log('Using Cloudinary URL:', avatarUrl);
    } else {
      // Local file URL
      avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
      console.log('Using local URL:', avatarUrl);
    }

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl
      }
    });

  } catch (error) {
    console.error('Upload Avatar Error:', error);
    next(error);
  }
};