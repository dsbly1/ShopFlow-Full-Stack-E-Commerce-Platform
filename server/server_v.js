const express = require('express');
const cors    = require('cors');
const http    = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin: [
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'http://127.0.0.1:5501',
      'http://localhost:5501',
      'https://shopflow-client.vercel.app',
      /\.vercel\.app$/
    ],
    methods: ['GET', 'POST']
  }
});

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
app.use('/uploads', require('express').static(require('path').join(__dirname, '../../public/uploads')));

app.use('/api/auth',       require('./src_routes/auth'));
app.use('/api/products',   require('./src_routes/products'));
app.use('/api/cart',       require('./src_routes/cart'));
app.use('/api/orders',     require('./src_routes/orders'));
app.use('/api/reviews',    require('./src_routes/reviews'));
app.use('/api/categories', require('./src_routes/categories'));
app.use('/api/sellers',    require('./src_routes/sellers'));
app.use('/api/admin',      require('./src_routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// Socket.io real-time order tracking
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_order_room', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined order room: order_${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io so routes can emit events
app.set('io', io);

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`ShopFlow API running on port ${PORT}`));
}

module.exports = app;