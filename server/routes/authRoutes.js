import express from 'express';
import {
    getProfile,
    loginUser,
    logout,
    registerUser,
    updateProfile
} from '../controllers/authController.js';
import { uploadAvatar, uploadAvatarController } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/upload-avatar', authenticateToken, uploadAvatar.single('avatar'), uploadAvatarController);
router.post('/logout', authenticateToken, logout);

export default router;