import express from 'express';

const router = express.Router();

// AI routes placeholder
router.post('/chat', (req, res) => {
  res.json({ message: 'AI chat endpoint - to be implemented' });
});

router.get('/config', (req, res) => {
  res.json({ message: 'AI config endpoint - to be implemented' });
});

router.post('/config', (req, res) => {
  res.json({ message: 'Update AI config endpoint - to be implemented' });
});

export default router;