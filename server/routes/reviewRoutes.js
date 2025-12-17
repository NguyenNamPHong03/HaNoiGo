import express from 'express';

const router = express.Router();

// Review routes placeholder
router.get('/', (req, res) => {
  res.json({ message: 'Get reviews endpoint - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create review endpoint - to be implemented' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update review endpoint - to be implemented' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete review endpoint - to be implemented' });
});

export default router;