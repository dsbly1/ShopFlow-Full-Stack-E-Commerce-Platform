const router = require('express').Router();
const db     = require('../db');

router.get('/', async (req, res) => {
  const { search = '', category, sort = 'created_at', order = 'DESC', page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;
  const allowed = ['price', 'created_at', 'name'];
  const sortCol = allowed.includes(sort) ? sort : 'created_at';

  try {
    let query = `
      SELECT p.*, c.name AS category_name,
             ROUND(AVG(r.rating),2) AS avg_rating,
             COUNT(DISTINCT r.id) AS review_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN reviews    r ON r.product_id = p.id
      WHERE p.name ILIKE $1
    `;
    const params = [`%${search}%`];

    if (category) {
      // Match products in this category OR any subcategory of it
      params.push(category);
      query += ` AND (p.category_id = $${params.length} OR c.parent_category_id = $${params.length})`;
    }

    query += ` GROUP BY p.id, c.name, c.parent_category_id ORDER BY p.${sortCol} ${order} LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, c.name AS category_name, ROUND(AVG(r.rating),2) AS avg_rating
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN reviews    r ON r.product_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, c.name
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});


const auth = require('../middleware/auth');

// GET /api/products/my — seller's own products
router.get('/my', auth, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Sellers only' });
  try {
    const { rows } = await db.query(
      `SELECT p.*, c.name AS category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.seller_id = $1 ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/products — seller creates product
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Sellers only' });
  const { name, description, price, stock_qty, category_id, image_url } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
  try {
    const { rows } = await db.query(
      `INSERT INTO products (name, description, price, stock_qty, category_id, image_url, seller_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, description, price, stock_qty || 0, category_id || null, image_url || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/products/:id — seller updates own product
router.put('/:id', auth, async (req, res) => {
  const { name, description, price, stock_qty, category_id, image_url } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE products SET name=$1, description=$2, price=$3, stock_qty=$4, category_id=$5, image_url=$6
       WHERE id=$7 AND (seller_id=$8 OR $9='admin') RETURNING *`,
      [name, description, price, stock_qty || 0, category_id || null, image_url || null,
       req.params.id, req.user.id, req.user.role]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found or not yours' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/products/:id — seller deletes own product
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `DELETE FROM products WHERE id=$1 AND (seller_id=$2 OR $3='admin') RETURNING id`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found or not yours' });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
