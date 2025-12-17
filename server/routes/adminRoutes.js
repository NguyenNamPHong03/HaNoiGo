import express from 'express';

const router = express.Router();

// Admin routes placeholder
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Admin dashboard data endpoint - to be implemented' });
});

router.get('/users', (req, res) => {
  res.json({ message: 'Admin get users endpoint - to be implemented' });
});

router.get('/places', (req, res) => {
  res.json({ message: 'Admin get places endpoint - to be implemented' });
});

export default router;