import express from 'express';

const router = express.Router();

// Chat routes placeholder
router.post('/message', (req, res) => {
  res.json({ message: 'Send chat message endpoint - to be implemented' });
});

router.get('/history', (req, res) => {
  res.json({ message: 'Get chat history endpoint - to be implemented' });
});

router.post('/feedback', (req, res) => {
  res.json({ message: 'Chat feedback endpoint - to be implemented' });
});

export default router;