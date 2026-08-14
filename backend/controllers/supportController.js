const SupportTicket = require('../models/SupportTicket');

exports.createTicket = async (req, res) => {
    try {
        const { subject, category, description } = req.body;
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
            status: 'OPEN'
        });
        res.status(201).json({
            success: true,
            message: 'Support ticket created successfully',
            ticketId: ticket.ticketId,
            ticket
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ userId: req.user.id })
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

exports.getTicketById = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        if (ticket.userId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this ticket'
            });
        }
        res.status(200).json({ success: true, ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addReply = async (req, res) => {
    try {
        const { message } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        ticket.conversation.push({
            senderId: req.user.id,
            message,
            isInternal: req.user.role === 'ADMIN'
        });
        if (ticket.status === 'OPEN' || ticket.status === 'WAITING_FOR_RESPONSE') {
            ticket.status = 'IN_PROGRESS';
        }
        await ticket.save();
        res.status(200).json({
            success: true,
            message: 'Reply added successfully',
            ticket
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.closeTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        ticket.status = 'CLOSED';
        ticket.closedAt = new Date();
        ticket.closedBy = req.user.id;
        await ticket.save();
        res.status(200).json({
            success: true,
            message: 'Ticket closed successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};