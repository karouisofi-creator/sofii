import express from 'express';
const router = express.Router();

// Example data endpoint
router.get('/', (req, res) => {
  res.json({
    claimsProcessed: 42,
    validationRate: '95%'
  });
});

export default router;
