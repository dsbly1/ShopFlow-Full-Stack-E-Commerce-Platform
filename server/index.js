const express = require('express');
const cors    = require('cors');
require('dotenv').config();
const app = express();
app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5501',
    'http://localhost:5501',
    'https://shopflow-client.vercel.app',
    'https://shopflow-client-13hmeou16-damonbly-101.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', require('express').static(require('path').join(__dirname, '../public/uploads')));
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/cart',       require('./routes/cart'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/reviews',    require('./routes/reviews'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/sellers',    require('./routes/sellers'));
app.use('/api/admin',      require('./routes/admin'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`ShopFlow API running on port ${PORT}`));
}

module.exports = app;
