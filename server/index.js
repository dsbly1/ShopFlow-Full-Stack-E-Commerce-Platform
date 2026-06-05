const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5500' }));
app.use(express.json());

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/reviews',  require('./routes/reviews'));
app.use('/api/admin',    require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ShopFlow API running on port ${PORT}`));
