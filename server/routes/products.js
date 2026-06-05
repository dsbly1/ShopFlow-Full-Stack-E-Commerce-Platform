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

module.exports = router;
