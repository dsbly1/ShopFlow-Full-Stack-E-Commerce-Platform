const router = require('express').Router();
const db     = require('../db_v');
const auth   = require('../src_middleware/auth');

// All cart routes require login
router.use(auth);

// GET /api/cart
router.get('/', async (req, res) => {
  const { rows } = await db.query(`
    SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price, p.image_url,
           (p.price * ci.quantity) AS subtotal
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = $1
  `, [req.user.id]);
  res.json(rows);
});

// POST /api/cart
router.post('/', async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  try {
    const { rows } = await db.query(`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
        DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      RETURNING *
    `, [req.user.id, product_id, quantity]);
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/cart/:id
router.patch('/:id', async (req, res) => {
  const { quantity } = req.body;
  const { rows } = await db.query(
    'UPDATE cart_items SET quantity=$1 WHERE id=$2 AND user_id=$3 RETURNING *',
    [quantity, req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Cart item not found' });
  res.json(rows[0]);
});

// DELETE /api/cart/:id
router.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM cart_items WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Item removed' });
});

module.exports = router;
