const router = require('express').Router();
const db     = require('../db_v');
const auth   = require('../src_middleware/auth');

// GET /api/sellers/:id — seller profile + stats
router.get('/:id', async (req, res) => {
  try {
    const seller = await db.query(
      `SELECT id, name, email, created_at FROM users WHERE id=$1 AND role='seller'`,
      [req.params.id]
    );
    if (!seller.rows.length) return res.status(404).json({ error: 'Seller not found' });

    const products = await db.query(
      `SELECT p.*, c.name AS category_name,
              ROUND(AVG(r.rating),2) AS avg_rating,
              COUNT(DISTINCT r.id) AS review_count
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN reviews r ON r.product_id = p.id
       WHERE p.seller_id = $1
       GROUP BY p.id, c.name
       ORDER BY p.created_at DESC`,
      [req.params.id]
    );

    const stats = await db.query(
      `SELECT COUNT(DISTINCT p.id) AS total_products,
              ROUND(AVG(r.rating),2) AS avg_rating,
              COUNT(DISTINCT r.id) AS total_reviews
       FROM products p
       LEFT JOIN reviews r ON r.product_id = p.id
       WHERE p.seller_id = $1`,
      [req.params.id]
    );

    res.json({
      seller: seller.rows[0],
      products: products.rows,
      stats: stats.rows[0]
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/sellers/:id/reviews — all reviews for seller's products
router.get('/:id/reviews', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, u.name AS reviewer, p.name AS product_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN products p ON p.id = r.product_id
       WHERE p.seller_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/sellers/:id/reviews — write review on seller page
router.post('/:id/reviews', auth, async (req, res) => {
  const { product_id, rating, comment } = req.body;
  if (!product_id || !rating) return res.status(400).json({ error: 'product_id and rating required' });
  try {
    const { rows } = await db.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, product_id, rating, comment]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'You already reviewed this product' });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
