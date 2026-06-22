const express = require('express');
const app = express();

app.use(express.json());
app.use(require('cors')({ origin: /\.vercel\.app$/, credentials: true }));

app.use('/api/auth',       require('../src_routes/auth'));
app.use('/api/products',   require('../src_routes/products'));
app.use('/api/cart',       require('../src_routes/cart'));
app.use('/api/orders',     require('../src_routes/orders'));
app.use('/api/reviews',    require('../src_routes/reviews'));
app.use('/api/categories', require('../src_routes/categories'));
app.use('/api/sellers',    require('../src_routes/sellers'));
app.use('/api/admin',      require('../src_routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

module.exports = app;
