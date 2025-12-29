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
const createStorage = (uploadType = 'avatars') => {
  const isCloudinaryConfigured = checkCloudinaryConfig();
  
  if (isCloudinaryConfigured) {
    console.log(`✅ Using Cloudinary storage for ${uploadType}`);
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Configure Cloudinary storage for Multer
    const folderMap = {
      'avatars': 'hanoigo/avatars',
      'places': 'hanoigo/places'
    };

    const transformMap = {
      'avatars': [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
      'places': [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }]
    };

    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: folderMap[uploadType] || folderMap['avatars'],
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: transformMap[uploadType] || transformMap['avatars']
      }
    });
  } else {
    console.log(`⚠️ Using LOCAL storage for ${uploadType} (Cloudinary not configured)`);
    // Fallback to local storage
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, `../uploads/${uploadType}`);
        // Tạo thư mục nếu chưa có
        import('fs').then(fs => {
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            console.log(`📁 Created directory: ${uploadPath}`);
          }
        });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });
  }
};

// Create function to get multer upload with dynamic storage
export const getUploadAvatar = () => {
  return multer({
    storage: createStorage('avatars'),
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
};

// Upload avatar controller
export const uploadAvatarController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Get user ID from JWT middleware (req.user is set by authenticateToken)
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    let avatarUrl;
    
    // Check if using Cloudinary by checking if file.path contains cloudinary
    const isCloudinaryUrl = req.file.path && req.file.path.includes('cloudinary.com');
    
    // Debug log
    console.log('📤 Upload Avatar - File info:', {
      filename: req.file.filename,
      path: req.file.path,
      originalname: req.file.originalname,
      isCloudinaryUrl,
      userId
    });
    
    if (isCloudinaryUrl) {
      // Cloudinary URL (already complete URL from Cloudinary)
      avatarUrl = req.file.path;
      console.log('✅ Using Cloudinary URL:', avatarUrl);
    } else {
      // Local file URL
      avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
      console.log('⚠️ Using local URL:', avatarUrl);
    }

    // ✅ CRITICAL FIX: Update user's avatarUrl in MongoDB
    const User = (await import('../models/User.js')).default;
    
    console.log('💾 Updating user avatarUrl in database...');
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatarUrl },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ User avatarUrl updated in DB:', updatedUser.avatarUrl);

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl: updatedUser.avatarUrl,
        user: updatedUser // Trả về user đầy đủ để frontend update context
      }
    });

  } catch (error) {
    console.error('❌ Upload Avatar Error:', error);
    next(error);
  }
};

// Upload place image controller (không cần auth cho admin)
export const uploadPlaceImageController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    let imageUrl;
    
    // Check if using Cloudinary by checking if file.path contains cloudinary
    const isCloudinaryUrl = req.file.path && req.file.path.includes('cloudinary.com');
    
    // Debug log
    console.log('Place image upload info:', {
      filename: req.file.filename,
      path: req.file.path,
      originalname: req.file.originalname,
      isCloudinaryUrl
    });
    
    if (isCloudinaryUrl) {
      // Cloudinary URL (already complete URL from Cloudinary)
      imageUrl = req.file.path;
      console.log('✅ Using Cloudinary URL for place image:', imageUrl);
    } else {
      // Local file URL for places
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/places/${req.file.filename}`;
      console.log('⚠️ Using local URL for place image:', imageUrl);
    }

    res.status(200).json({
      success: true,
      message: 'Place image uploaded successfully',
      data: {
        imageUrl
      }
    });

  } catch (error) {
    console.error('Upload Place Image Error:', error);
    next(error);
  }
};

// Get upload function cho place images
export const getUploadPlaceImage = () => {
  return multer({ 
    storage: createStorage('places'),
    limits: { 
      fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Check file type - allow common image formats including jfif
      const allowedTypes = /jpeg|jpg|png|gif|webp|jfif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  });
};