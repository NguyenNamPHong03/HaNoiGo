import express from 'express';
import { getLatestPlaces, getPlaceById } from '../controllers/placesController.js';

const router = express.Router();

// Public endpoint - Get latest places for homepage
router.get('/latest', getLatestPlaces);

// Public endpoint - Get place by ID
router.get('/:id', getPlaceById);

// Places routes placeholder (for future implementation)
router.get('/', (req, res) => {
  res.json({ message: 'Get places endpoint - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create place endpoint - to be implemented' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update place endpoint - to be implemented' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete place endpoint - to be implemented' });
});

export default router;