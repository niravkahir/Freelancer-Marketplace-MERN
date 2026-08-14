const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

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

        // Populate sender details
        const populatedMessage = await Message.findById(message._id)
            .populate('senderId', 'name email profilePicture')
            .populate('receiverId', 'name email profilePicture');

        // ✅ CREATE NOTIFICATION FOR RECEIVER
        await Notification.create({
            userId: receiverId,
            type: 'MESSAGE_RECEIVED',
            title: 'New Message',
            message: `${req.user.name} sent you a message: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`,
            link: `/messages/${req.user.id}`,
            relatedEntity: {
                entityType: 'MESSAGE',
                entityId: message._id
            },
            priority: 'HIGH'
        });

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: populatedMessage
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

        // Check if other user exists
        const otherUser = await User.findById(otherUserId);
        if (!otherUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const messages = await Message.find({
            $or: [
                { senderId: req.user.id, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: req.user.id }
            ],
            isDeleted: false
        })
        .populate('senderId', 'name email profilePicture')
        .populate('receiverId', 'name email profilePicture')
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
            ],
            isDeleted: false
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
                        isRead: msg.isRead,
                        senderId: msg.senderId._id
                    },
                    unreadCount: 0
                });
            }
        });

        // Calculate unread counts for each conversation
        const conversations = Array.from(conversationMap.values());
        
        for (const conv of conversations) {
            const unread = await Message.countDocuments({
                senderId: conv.user._id,
                receiverId: req.user.id,
                isRead: false,
                isDeleted: false
            });
            conv.unreadCount = unread;
        }

        // Sort by latest message
        conversations.sort((a, b) => {
            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

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

// @desc    Delete message (soft delete)
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if user is sender or receiver
        if (message.senderId.toString() !== req.user.id && 
            message.receiverId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this message'
            });
        }

        // Soft delete based on who is deleting
        if (message.senderId.toString() === req.user.id) {
            message.deletedForSender = true;
        } else {
            message.deletedForReceiver = true;
        }

        // If both deleted, mark as fully deleted
        if (message.deletedForSender && message.deletedForReceiver) {
            message.isDeleted = true;
        }

        await message.save();

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markMessageAsRead = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        if (message.receiverId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        message.isRead = true;
        message.readAt = new Date();
        await message.save();

        res.status(200).json({
            success: true,
            message: 'Message marked as read'
        });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};