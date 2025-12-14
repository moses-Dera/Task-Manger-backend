const jwt = require('jsonwebtoken');
const User = require('./models/User');

/**
 * Initialize Socket.io server with authentication and event handlers
 * @param {Server} io - Socket.io server instance
 */
function initializeSocket(io) {
    // Track online users
    const onlineUsers = new Map(); // userId -> socketId

    // Authentication middleware for socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('name email role company').lean();

            if (!user) {
                return next(new Error('Authentication error: Invalid token'));
            }

            socket.userId = user._id.toString();
            socket.userEmail = user.email;
            socket.userName = user.name;
            socket.userRole = user.role;
            socket.userCompany = user.company;

            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error'));
        }
    });

    // Connection event
    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.userName} (${socket.userId})`);

        // Add user to online users
        onlineUsers.set(socket.userId, socket.id);

        // Broadcast user online status to their company
        socket.broadcast.emit('user_online', {
            userId: socket.userId,
            userName: socket.userName,
            userRole: socket.userRole
        });

        // Join company room for company-wide broadcasts
        socket.join(`company_${socket.userCompany}`);
        // Join own room for direct messages
        socket.join(socket.userId);

        // Send current online users to the newly connected user
        const onlineUsersList = Array.from(onlineUsers.keys());
        socket.emit('online_users', onlineUsersList);

        // ==================== CHAT EVENTS ====================



        /**
         * Handle typing indicator
         * Payload: { recipientId }
         */
        socket.on('typing', (data) => {
            const recipientSocketId = onlineUsers.get(data.recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('user_typing', {
                    userId: socket.userId,
                    userName: socket.userName
                });
            }
        });

        /**
         * Handle stop typing indicator
         * Payload: { recipientId }
         */
        socket.on('stop_typing', (data) => {
            const recipientSocketId = onlineUsers.get(data.recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('user_stop_typing', {
                    userId: socket.userId
                });
            }
        });

        // ==================== NOTIFICATION EVENTS ====================

        /**
         * Emit notification to specific user
         * This is called from backend controllers
         */
        socket.on('send_notification', (data) => {
            const recipientSocketId = onlineUsers.get(data.userId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('new_notification', {
                    id: data.id,
                    title: data.title,
                    message: data.message,
                    type: data.type,
                    timestamp: new Date()
                });
            }
        });

        // ==================== TASK EVENTS ====================

        /**
         * Notify about task updates
         * Payload: { taskId, assignedTo, action }
         */
        socket.on('task_update', (data) => {
            const recipientSocketId = onlineUsers.get(data.assignedTo);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('task_updated', {
                    taskId: data.taskId,
                    action: data.action,
                    updatedBy: socket.userName,
                    timestamp: new Date()
                });
            }
        });

        // ==================== DISCONNECTION ====================

        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.userName} (${socket.userId})`);

            // Remove from online users
            onlineUsers.delete(socket.userId);

            // Broadcast user offline status
            socket.broadcast.emit('user_offline', {
                userId: socket.userId,
                userName: socket.userName
            });
        });

        // ==================== ERROR HANDLING ====================

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    // Helper function to emit notification from backend controllers
    io.emitNotification = (userId, notification) => {
        const recipientSocketId = onlineUsers.get(userId.toString());
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('new_notification', notification);
        }
    };

    // Helper function to emit task update from backend controllers
    io.emitTaskUpdate = (userId, taskUpdate) => {
        const recipientSocketId = onlineUsers.get(userId.toString());
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('task_updated', taskUpdate);
        }
    };

    console.log('🚀 Socket.io server initialized');
}

module.exports = { initializeSocket };
