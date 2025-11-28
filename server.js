const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { initializeSocket } = require('./socket');
const { specs, swaggerUi } = require('./swagger');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const teamRoutes = require('./routes/team');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');
const logsRoutes = require('./routes/logs');
const systemRoutes = require('./routes/system');
const fixUserRoutes = require('./routes/fixUser');
const analyticsRoutes = require('./routes/analytics');
const templateRoutes = require('./routes/templates');

const app = express();

// Trust proxy is required for rate limiting behind a proxy (like Render/Heroku)
app.set('trust proxy', 1);

const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Initialize socket handlers
initializeSocket(io);

// Make io accessible to routes
app.set('io', io);

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

// TODO: Restrict CORS to specific origins in production for security
app.use(cors({
  origin: true, // Allow all origins temporarily
  credentials: true
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Task Manager API Docs'
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/fix', fixUserRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templateRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server ready`);
});