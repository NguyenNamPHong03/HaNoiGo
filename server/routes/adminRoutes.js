import express from 'express';
import {
    bulkRefreshGoogleData,
    bulkUpdatePlaces,
    createPlace,
    deletePlace,
    getAiTagsOptions,
    getAllPlaces,
    getDistricts,
    getPlaceById,
    getPlaceStats,
    refreshGoogleData,
    updateAiTags,
    updatePlace
} from '../controllers/placesController.js';
import { getUploadPlaceImage, uploadPlaceImageController } from '../controllers/uploadController.js';
import {
    banUser,
    deleteUser,
    getUserById,
    getUsers,
    getUserStats,
    updateUser
} from '../controllers/userController.js';

const router = express.Router();

// Apply auth middleware to all admin routes (temporarily disabled for testing)
// router.use(authenticateToken);

// Admin dashboard
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Admin dashboard data endpoint - to be implemented' });
});

// Test endpoint cho debugging
router.get('/test', (req, res) => {
  console.log('🔍 Admin test endpoint called');
  res.json({ 
    success: true, 
    message: 'Admin routes working!',
    timestamp: new Date().toISOString()
  });
});

// Places management routes
router.get('/places', getAllPlaces);
router.get('/places/stats', getPlaceStats);
router.get('/places/:id', getPlaceById);
router.post('/places', createPlace);
router.put('/places/:id', updatePlace);
router.delete('/places/:id', deletePlace);

// AI Tags auto-generation
router.post('/places/:id/refresh-google', refreshGoogleData);
router.post('/places/bulk-refresh-google', bulkRefreshGoogleData);

// Bulk operations
router.post('/places/bulk', bulkUpdatePlaces);

// AI Tags management
router.patch('/places/:id/ai-tags', updateAiTags);

// Helper endpoints
router.get('/districts', getDistricts);
router.get('/ai-tags-options', getAiTagsOptions);

// Upload endpoint cho place images (không cần auth)
router.post('/upload/place-image', (req, res, next) => {
  const uploadPlaceImage = getUploadPlaceImage();
  uploadPlaceImage.single('image')(req, res, next);
}, uploadPlaceImageController);

// Users management
router.get('/users', getUsers);
router.get('/users/stats', getUserStats);
router.get('/users/:id', getUserById);
router.patch('/users/:id', updateUser);
router.post('/users/:id/ban', banUser);
router.delete('/users/:id', deleteUser);

export default router;