const jwt = require('jsonwebtoken');
const User = require('../models/User');

const onlineUsers = new Map(); // userId → socketId

const socketHandler = (io) => {
    // ✅ Authenticate socket via JWT
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('No token'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) return next(new Error('User not found'));

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();
        onlineUsers.set(userId, socket.id);
        socket.join(userId);

        console.log(`🟢 Connected: ${socket.user.name} (${userId})`);

        io.emit('onlineUsers', Array.from(onlineUsers.keys()));

        // ---------- SEND MESSAGE ----------
        socket.on('sendMessage', (payload) => {
            io.to(payload.receiverId).emit('receiveMessage', payload.message);
            io.to(payload.receiverId).emit('unreadUpdate');
            io.to(payload.receiverId).emit('refreshUnread');
        });

        // ---------- TYPING ----------
        socket.on('typing', ({ receiverId, senderName }) => {
            io.to(receiverId).emit('typing', {
                senderId: userId,
                senderName
            });
        });

        socket.on('stopTyping', ({ receiverId }) => {
            io.to(receiverId).emit('stopTyping', { senderId: userId });
        });

        // ---------- READ RECEIPT ----------
        socket.on('markAsRead', ({ senderId }) => {
            io.to(senderId).emit('messageRead', { by: userId });
        });

        // ✅ NEW: ask navbar to refresh unread badge
        socket.on('refreshUnread', () => {
            io.to(userId).emit('refreshUnread');
            io.to(userId).emit('newNotification');
        });

        // ---------- DISCONNECT ----------
        socket.on('disconnect', () => {
            onlineUsers.delete(userId);
            io.emit('onlineUsers', Array.from(onlineUsers.keys()));
            console.log(`🔴 Disconnected: ${socket.user.name}`);
        });
    });
};

module.exports = socketHandler;