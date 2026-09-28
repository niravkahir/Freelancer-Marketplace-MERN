const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create support ticket
// @route   POST /api/support
// @access  Private
exports.createTicket = async (req, res) => {
    try {
        const { subject, category, description, priority } = req.body;

        if (!subject || !category || !description) {
            return res.status(400).json({
                success: false,
                message: 'Please provide subject, category, and description'
            });
        }

        const ticket = await SupportTicket.create({
            userId: req.user.id,
            subject,
            category,
            description,
            priority: priority || 'MEDIUM',
            status: 'OPEN',
            conversation: [{
                senderId: req.user.id,
                message: description,
                isInternal: false,
                sentAt: new Date()
            }]
        });

        // ✅ Notify all admins
        try {
            const admins = await User.find({ role: 'ADMIN' });
            for (const admin of admins) {
                await Notification.create({
                    userId: admin._id,
                    type: 'SYSTEM_UPDATE',
                    title: 'New Support Ticket 🎫',
                    message: `${req.user.name}: "${subject}"`,
                    link: `/support/${ticket._id}`,
                    relatedEntity: { entityType: 'USER', entityId: ticket._id }
                });

                if (req.io) {
                    req.io.to(admin._id.toString()).emit('newNotification');
                }
            }
        } catch (e) { console.error('Notif error:', e); }

        res.status(201).json({
            success: true,
            message: 'Support ticket created successfully',
            ticketId: ticket.ticketId,
            ticket
        });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get my tickets
// @route   GET /api/support
// @access  Private
exports.getMyTickets = async (req, res) => {
    try {
        // Admins see all, users see only theirs
        const filter = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };

        const tickets = await SupportTicket.find(filter)
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tickets.length,
            tickets
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single ticket
// @route   GET /api/support/:id
// @access  Private
exports.getTicketById = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate('userId', 'name email role')
            .populate('conversation.senderId', 'name email role')
            .populate('assignedTo', 'name email');

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Only owner or admin
        if (
            ticket.userId._id.toString() !== req.user.id &&
            req.user.role !== 'ADMIN'
        ) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.status(200).json({ success: true, ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add reply
// @route   POST /api/support/:id/reply
// @access  Private
exports.addReply = async (req, res) => {
    try {
        const { message, isInternal } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (
            ticket.userId.toString() !== req.user.id &&
            req.user.role !== 'ADMIN'
        ) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message required' });
        }

        ticket.conversation.push({
            senderId: req.user.id,
            message: message.trim(),
            isInternal: req.user.role === 'ADMIN' && isInternal === true,
            sentAt: new Date()
        });

        // Auto-update status
        if (req.user.role === 'ADMIN') {
            if (ticket.status === 'OPEN' || ticket.status === 'WAITING_FOR_RESPONSE') {
                ticket.status = 'IN_PROGRESS';
            }
        } else {
            if (ticket.status === 'IN_PROGRESS') {
                ticket.status = 'WAITING_FOR_RESPONSE';
            }
        }

        await ticket.save();

        // ✅ Notify the other party
        const receiverId =
            req.user.role === 'ADMIN' ? ticket.userId : null;

        if (receiverId) {
            try {
                await Notification.create({
                    userId: receiverId,
                    type: 'SYSTEM_UPDATE',
                    title: 'Support Reply 💬',
                    message: `Your ticket "${ticket.subject}" has a new reply`,
                    link: `/support/${ticket._id}`,
                    relatedEntity: { entityType: 'USER', entityId: ticket._id }
                });

                if (req.io) {
                    req.io.to(receiverId.toString()).emit('newNotification');
                    req.io.to(receiverId.toString()).emit('ticketChanged', {
                        ticketId: ticket._id
                    });
                }
            } catch (e) { console.error('Notif error:', e); }
        } else {
            // User replied — notify all admins
            const admins = await User.find({ role: 'ADMIN' });
            for (const admin of admins) {
                if (req.io) {
                    req.io.to(admin._id.toString()).emit('newNotification');
                    req.io.to(admin._id.toString()).emit('ticketChanged', {
                        ticketId: ticket._id
                    });
                }
            }
        }

        res.status(200).json({
            success: true,
            message: 'Reply added',
            ticket
        });
    } catch (error) {
        console.error('Add reply error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Close ticket
// @route   PUT /api/support/:id/close
// @access  Private (owner or admin)
exports.closeTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (
            ticket.userId.toString() !== req.user.id &&
            req.user.role !== 'ADMIN'
        ) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        ticket.status = 'CLOSED';
        ticket.closedAt = new Date();
        ticket.closedBy = req.user.id;
        if (req.body.resolution) {
            ticket.resolution = req.body.resolution;
        }
        await ticket.save();

        res.status(200).json({
            success: true,
            message: 'Ticket closed',
            ticket
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Rate closed ticket
// @route   PUT /api/support/:id/rate
// @access  Private (owner)
exports.rateTicket = async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (ticket.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (rating) ticket.rating = rating;
        if (feedback) ticket.feedback = feedback;
        await ticket.save();

        res.status(200).json({
            success: true,
            message: 'Thank you for your feedback',
            ticket
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};