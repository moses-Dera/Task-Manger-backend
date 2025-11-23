const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const teamRoutes = require('./routes/team');
const chatRoutes = require('./routes/chat');
const simpleChatRoutes = require('./routes/simpleChat');
const fixUserRoutes = require('./routes/fixUser');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://b2-b-task-manager.vercel.app",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Socket.IO authentication and chat
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error('User not found');
    
    socket.userId = user._id;
    socket.company = user.company || 'default';
    socket.userName = user.name;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  socket.join(socket.company);
  
  socket.on('sendMessage', (data) => {
    const messageData = {
      _id: new Date().getTime().toString(),
      sender_id: { _id: socket.userId, name: socket.userName },
      message: data.message,
      createdAt: new Date().toISOString()
    };
    
    io.to(socket.company).emit('newMessage', messageData);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userName);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/chat', simpleChatRoutes);
app.use('/api/fix', fixUserRoutes);
app.use('/api/notifications', notificationRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});