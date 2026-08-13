const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;

        if (!receiverId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Please provide receiverId and content'
            });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: 'Receiver not found'
            });
        }

        // Create message
        const message = await Message.create({
            senderId: req.user.id,
            receiverId,
            content,
            isRead: false
        });

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error sending message'
        });
    }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:userId
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        const otherUserId = req.params.userId;

        const messages = await Message.find({
            $or: [
                { senderId: req.user.id, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: req.user.id }
            ]
        })
        .populate('senderId', 'name email')
        .populate('receiverId', 'name email')
        .sort({ createdAt: 1 });

        // Mark messages as read
        await Message.updateMany(
            {
                senderId: otherUserId,
                receiverId: req.user.id,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.status(200).json({
            success: true,
            count: messages.length,
            messages
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching messages'
        });
    }
};

// @desc    Get conversations list
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
    try {
        // Get all messages involving the user
        const messages = await Message.find({
            $or: [
                { senderId: req.user.id },
                { receiverId: req.user.id }
            ]
        })
        .populate('senderId', 'name email profilePicture')
        .populate('receiverId', 'name email profilePicture')
        .sort({ createdAt: -1 });

        // Get unique conversations
        const conversationMap = new Map();
        
        messages.forEach(msg => {
            const otherUser = msg.senderId._id.toString() === req.user.id 
                ? msg.receiverId 
                : msg.senderId;
            
            const key = otherUser._id.toString();
            
            if (!conversationMap.has(key) || 
                conversationMap.get(key).lastMessage.createdAt < msg.createdAt) {
                conversationMap.set(key, {
                    user: otherUser,
                    lastMessage: {
                        content: msg.content,
                        createdAt: msg.createdAt,
                        isRead: msg.isRead
                    },
                    unreadCount: 0
                });
            }
        });

        // Calculate unread counts
        const conversations = Array.from(conversationMap.values());
        
        for (const conv of conversations) {
            const unread = await Message.countDocuments({
                senderId: conv.user._id,
                receiverId: req.user.id,
                isRead: false
            });
            conv.unreadCount = unread;
        }

        res.status(200).json({
            success: true,
            count: conversations.length,
            conversations
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching conversations'
        });
    }
};