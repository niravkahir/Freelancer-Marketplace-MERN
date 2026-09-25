const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Proposal = require('../models/Proposal');
const Project = require('../models/Project');

// @desc    Get or create conversation with another user about a project
// @route   POST /api/conversations
// @access  Private
exports.getOrCreateConversation = async (req, res) => {
    try {
        const { otherUserId, projectId } = req.body;

        if (!otherUserId || !projectId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide otherUserId and projectId'
            });
        }

        // Find or create
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user.id, otherUserId] },
            relatedProject: projectId
        })
            .populate('participants', 'name email profilePicture role')
            .populate('relatedProject', 'title status');

        if (!conversation) {
            // Verify permission: client must own project OR freelancer must have applied
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            const isClient = project.clientId.toString() === req.user.id;
            const isFreelancerWhoApplied = await Proposal.findOne({
                projectId,
                freelancerId: req.user.id
            });

            if (!isClient && !isFreelancerWhoApplied && req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'You can only chat about projects you are involved in'
                });
            }

            conversation = await Conversation.create({
                participants: [req.user.id, otherUserId],
                relatedProject: projectId,
                chatMode: 'PRE_HIRE'
            });

            conversation = await Conversation.findById(conversation._id)
                .populate('participants', 'name email profilePicture role')
                .populate('relatedProject', 'title status');
        }

        res.status(200).json({ success: true, conversation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all my conversations
// @route   GET /api/conversations
// @access  Private
exports.getMyConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id
        })
            .populate('participants', 'name email profilePicture role')
            .populate('relatedProject', 'title status')
            .sort({ 'lastMessage.sentAt': -1, updatedAt: -1 });

        // Add unread count for the current user
        const result = conversations.map((c) => {
            const unread = c.unreadCounts.find(
                (u) => u.userId.toString() === req.user.id
            );
            return {
                ...c.toObject(),
                myUnreadCount: unread ? unread.count : 0
            };
        });

        res.status(200).json({
            success: true,
            count: result.length,
            conversations: result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single conversation + messages
// @route   GET /api/conversations/:id
// @access  Private (participant only)
exports.getConversationById = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id)
            .populate('participants', 'name email profilePicture role')
            .populate('relatedProject', 'title status');

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        // Check if participant
        const isParticipant = conversation.participants.some(
            (p) => p._id.toString() === req.user.id
        );

        if (!isParticipant && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const messages = await Message.find({ conversationId: conversation._id })
            .populate('senderId', 'name email profilePicture')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            conversation,
            messages
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Lock conversation (client only, pre-hire)
// @route   PUT /api/conversations/:id/lock
// @access  Private (Client only)
exports.lockConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        if (!conversation.participants.some(p => p.toString() === req.user.id)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (req.user.role !== 'CLIENT') {
            return res.status(403).json({
                success: false,
                message: 'Only clients can lock conversations'
            });
        }

        if (conversation.chatMode === 'POST_HIRE') {
            return res.status(400).json({
                success: false,
                message: 'Cannot lock an active project conversation'
            });
        }

        conversation.isLocked = true;
        conversation.lockedBy = req.user.id;
        conversation.lockedAt = new Date();
        conversation.lockReason = 'CLIENT_STOPPED';
        await conversation.save();

        // ✅ Emit to both participants
        if (req.io) {
            conversation.participants.forEach((p) => {
                req.io.to(p.toString()).emit('conversationUpdated', {
                    conversationId: conversation._id,
                    isLocked: true,
                    lockReason: 'CLIENT_STOPPED',
                });
            });
        }

        res.status(200).json({
            success: true,
            message: 'Conversation locked',
            conversation
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Unlock conversation
// @route   PUT /api/conversations/:id/unlock
// @access  Private (Client only)
exports.unlockConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        if (!conversation.participants.some(p => p.toString() === req.user.id)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (req.user.role !== 'CLIENT') {
            return res.status(403).json({
                success: false,
                message: 'Only clients can unlock conversations'
            });
        }

        conversation.isLocked = false;
        conversation.lockedBy = null;
        conversation.lockedAt = null;
        conversation.lockReason = null;
        await conversation.save();

        if (req.io) {
            conversation.participants.forEach((p) => {
                req.io.to(p.toString()).emit('conversationUpdated', {
                    conversationId: conversation._id,
                    isLocked: false,
                    lockReason: null,
                });
            });
        }

        res.status(200).json({
            success: true,
            message: 'Conversation unlocked',
            conversation
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};