import express from 'express';

const router = express.Router();

// Auth routes placeholder
router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint - to be implemented' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - to be implemented' });
});

router.post('/refresh', (req, res) => {
  res.json({ message: 'Refresh token endpoint - to be implemented' });
});

export default router;