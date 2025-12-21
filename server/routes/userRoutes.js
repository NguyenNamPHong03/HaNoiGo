import express from 'express';
import {
  banUser,
  deleteUser,
  getUserById,
  getUsers,
  getUserStats,
  updateUser
} from '../controllers/userController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin-only routes
router.get('/stats', authenticateAdmin, getUserStats);
router.get('/', authenticateAdmin, getUsers);
router.get('/:id', authenticateAdmin, getUserById);
router.patch('/:id', authenticateAdmin, updateUser);
router.post('/:id/ban', authenticateAdmin, banUser);
router.delete('/:id', authenticateAdmin, deleteUser);

export default router;