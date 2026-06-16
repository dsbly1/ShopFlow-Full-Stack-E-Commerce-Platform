const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

router.use(auth);

// GET /api/orders — user's own orders
router.get('/', async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
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

// PATCH /api/orders/:id/status — update order status + emit real-time event
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  try {
    const { rows } = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Order not found' });

    // Emit real-time event to anyone watching this order
    const io = req.app.get('io');
    if (io) {
      io.to(`order_${id}`).emit('order_status_updated', {
        orderId: id,
        status,
        updatedAt: new Date().toISOString()
      });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;