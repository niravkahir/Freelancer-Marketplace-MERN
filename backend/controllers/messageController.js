const Message = require('../models/Message');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

// @desc    Send message (with restrictions)
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, content } = req.body;

        if (!conversationId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Please provide conversationId and content'
            });
        }

        const conversation = await Conversation.findById(conversationId)
            .populate('participants', '_id name');

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        // Check participant
        const isParticipant = conversation.participants.some(
            (p) => p._id.toString() === req.user.id
        );
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // ✅ RESTRICTION 1: Locked conversation
        if (conversation.isLocked) {
            return res.status(403).json({
                success: false,
                message: `This conversation is locked (${conversation.lockReason})`
            });
        }

        // ✅ RESTRICTION 2: Pre-hire — freelancer cannot start
        if (conversation.chatMode === 'PRE_HIRE' && req.user.role === 'FREELANCER') {
            const messageCount = await Message.countDocuments({
                conversationId: conversation._id
            });
            if (messageCount === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Only the client can start this conversation'
                });
            }
        }

        // Other participant
        const receiver = conversation.participants.find(
            (p) => p._id.toString() !== req.user.id
        );

        // Create message
        const message = await Message.create({
            conversationId: conversation._id,
            senderId: req.user.id,
            receiverId: receiver._id,
            content,
            isRead: false
        });

        // Update conversation.lastMessage + unread count
        conversation.lastMessage = {
            content,
            senderId: req.user.id,
            sentAt: new Date()
        };

        const receiverUnread = conversation.unreadCounts.find(
            (u) => u.userId.toString() === receiver._id.toString()
        );
        if (receiverUnread) {
            receiverUnread.count += 1;
        } else {
            conversation.unreadCounts.push({
                userId: receiver._id,
                count: 1
            });
        }

        await conversation.save();

        // Populate message for response
        const populatedMessage = await Message.findById(message._id)
            .populate('senderId', 'name email profilePicture');

        // ✅ Create notification for receiver
        await Notification.create({
            userId: receiver._id,
            type: 'MESSAGE_RECEIVED',
            title: 'New Message',
            message: `${req.user.name} sent you a message`,
            link: `/messages/${conversation._id}`,
            relatedEntity: {
                entityType: 'MESSAGE',
                entityId: message._id
            }
        });

        // ✅ Emit to BOTH receiver and sender (for cross-tab sync)
        if (req.io) {
            req.io.to(receiver._id.toString()).emit('receiveMessage', populatedMessage);
            req.io.to(receiver._id.toString()).emit('refreshUnread');
            req.io.to(req.user.id.toString()).emit('receiveMessage', populatedMessage);
        }

        res.status(201).json({
            success: true,
            message: populatedMessage
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark all messages in conversation as read
// @route   PUT /api/messages/conversation/:id/read
// @access  Private
exports.markConversationRead = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        if (!conversation.participants.some(p => p.toString() === req.user.id)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await Message.updateMany(
            {
                conversationId: conversation._id,
                receiverId: req.user.id,
                isRead: false
            },
            { isRead: true, readAt: new Date() }
        );

        // Reset unread count for this user
        const entry = conversation.unreadCounts.find(
            (u) => u.userId.toString() === req.user.id
        );
        if (entry) {
            entry.count = 0;
            await conversation.save();
        }

        res.status(200).json({ success: true, message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiverId: req.user.id,
            isRead: false
        });

        res.status(200).json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};