const router = require('express').Router();
const db     = require('../db_v');
const auth   = require('../src_middleware/auth');
const admin  = require('../src_middleware/admin');

router.use(auth, admin);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  const [revenue, orders, users, top] = await Promise.all([
    db.query('SELECT SUM(total_price) AS total_revenue FROM orders WHERE status != $1', ['cancelled']),
    db.query('SELECT COUNT(*) AS total_orders, status, COUNT(*) FROM orders GROUP BY status'),
    db.query('SELECT COUNT(*) AS total_users FROM users WHERE role = $1', ['customer']),
    db.query('SELECT * FROM top_products LIMIT 5'),
  ]);
  res.json({
    total_revenue: revenue.rows[0].total_revenue,
    orders:        orders.rows,
    total_users:   users.rows[0].total_users,
    top_products:  top.rows,
  });
});

// POST /api/admin/products
router.post('/products', async (req, res) => {
  const { name, description, price, stock_qty, category_id, image_url } = req.body;
  const { rows } = await db.query(
    'INSERT INTO products (name,description,price,stock_qty,category_id,image_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [name, description, price, stock_qty, category_id, image_url]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/admin/products/:id
router.put('/products/:id', async (req, res) => {
  const { name, description, price, stock_qty, category_id, image_url } = req.body;
  const { rows } = await db.query(
    'UPDATE products SET name=$1,description=$2,price=$3,stock_qty=$4,category_id=$5,image_url=$6 WHERE id=$7 RETURNING *',
    [name, description, price, stock_qty, category_id, image_url, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Product not found' });
  res.json(rows[0]);
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  await db.query('DELETE FROM products WHERE id=$1', [req.params.id]);
  res.json({ message: 'Product deleted' });
});

module.exports = router;
