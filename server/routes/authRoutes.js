import express from 'express';
import {
    createAdmin,
    getProfile,
    loginUser,
    logout,
    registerUser,
    updateProfile
} from '../controllers/authController.js';
import { getUploadAvatar, uploadAvatarController } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Admin routes (development only)
router.post('/create-admin', createAdmin);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
// Dynamic multer upload route
router.post('/upload-avatar', authenticateToken, (req, res, next) => {
  const uploadAvatar = getUploadAvatar();
  uploadAvatar.single('avatar')(req, res, next);
}, uploadAvatarController);
router.post('/logout', authenticateToken, logout);

export default router;