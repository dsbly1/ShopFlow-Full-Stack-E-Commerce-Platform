const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

// GET /api/reviews/:productId
router.get('/:productId', async (req, res) => {
  const { rows } = await db.query(`
    SELECT r.*, u.name AS reviewer
    FROM reviews r JOIN users u ON u.id = r.user_id
    WHERE r.product_id = $1
    ORDER BY r.created_at DESC
  `, [req.params.productId]);
  res.json(rows);
});

// POST /api/reviews (auth required)
router.post('/', auth, async (req, res) => {
  const { product_id, rating, comment } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, product_id, rating, comment]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'You already reviewed this product' });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
