const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

router.use(auth);

// GET /api/orders — user's own orders
router.get('/', async (req, res) => {
  const { rows } = await db.query(`
    SELECT o.*, json_agg(json_build_object(
      'product_id', oi.product_id,
      'name', p.name,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price
    )) AS items
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p     ON p.id = oi.product_id
    WHERE o.user_id = $1
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `, [req.user.id]);
  res.json(rows);
});

// POST /api/orders — place order using stored procedure
router.post('/', async (req, res) => {
  const { shipping_address, items } = req.body;
  if (!shipping_address || !items?.length)
    return res.status(400).json({ error: 'shipping_address and items required' });

  try {
    const { rows } = await db.query(
      'SELECT place_order($1, $2, $3::json) AS order_id',
      [req.user.id, shipping_address, JSON.stringify(items)]
    );
    res.status(201).json({ order_id: rows[0].order_id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
