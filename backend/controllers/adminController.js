const User = require('../models/User');
const Project = require('../models/Project');
const Contract = require('../models/Contract');
const Payment = require('../models/Payment');
const SupportTicket = require('../models/SupportTicket');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const Notification = require('../models/Notification');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalClients,
            totalFreelancers,
            totalProjects,
            activeProjects,
            completedProjects,
            totalContracts,
            activeContracts,
            completedPayments,
            pendingTickets,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'CLIENT' }),
            User.countDocuments({ role: 'FREELANCER' }),
            Project.countDocuments(),
            Project.countDocuments({ status: 'In Progress' }),
            Project.countDocuments({ status: 'Completed' }),
            Contract.countDocuments(),
            Contract.countDocuments({ status: 'ACTIVE' }),
            Payment.find({ status: 'COMPLETED' }),
            SupportTicket.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
        ]);

        const totalRevenue = completedPayments.reduce(
            (sum, p) => sum + (p.amount || 0),
            0
        );

        const recentUsers = await User.find()
            .select('name email role createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalClients,
                totalFreelancers,
                totalProjects,
                activeProjects,
                completedProjects,
                totalContracts,
                activeContracts,
                totalPayments: completedPayments.length,
                totalRevenue,
                pendingTickets,
                recentUsers,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;

        const filter = {};
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle block/unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private (Admin)
exports.toggleBlockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Cannot block admin' });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        // ✅ Notify user (only on UNBLOCK, since blocked users can't fetch anyway)
        if (!user.isBlocked) {
            try {
                await Notification.create({
                    userId: user._id,
                    type: 'USER_UNBLOCKED',
                    title: 'Account Unblocked ✅',
                    message: 'Your account has been unblocked. Welcome back!',
                    link: '/dashboard',
                });

                if (req.io) {
                    req.io.to(user._id.toString()).emit('newNotification');
                }
            } catch (e) {}
        }

        res.status(200).json({
            success: true,
            message: user.isBlocked ? 'User blocked' : 'User unblocked',
            user,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Cannot delete admin' });
        }

        await FreelancerProfile.deleteOne({ userId: user._id });
        await ClientProfile.deleteOne({ userId: user._id });
        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all projects
// @route   GET /api/admin/projects
// @access  Private (Admin)
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('clientId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            projects,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete project
// @route   DELETE /api/admin/projects/:id
// @access  Private (Admin)
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        await project.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all support tickets
// @route   GET /api/admin/support
// @access  Private (Admin)
exports.getAllTickets = async (req, res) => {
    try {
        const { status } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const tickets = await SupportTicket.find(filter)
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tickets.length,
            tickets,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark ticket as IN_PROGRESS (admin) with optional message
// @route   PUT /api/admin/support/:id/in-progress
// @access  Private (Admin)
exports.markTicketInProgress = async (req, res) => {
    try {
        const { message } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'Cannot reopen a resolved/closed ticket',
            });
        }

        ticket.status = 'IN_PROGRESS';
        ticket.assignedTo = req.user.id;

        if (message && message.trim()) {
            ticket.conversation.push({
                senderId: req.user.id,
                message: message.trim(),
                isInternal: false,
                sentAt: new Date(),
            });
        }

        await ticket.save();

        // ✅ Notify user
        try {
            await Notification.create({
                userId: ticket.userId,
                type: 'SYSTEM_UPDATE',
                title: 'Support Ticket In Progress 💬',
                message: `Your ticket "${ticket.subject}" is now being reviewed by our team.`,
                link: `/support/${ticket._id}`,
                relatedEntity: { entityType: 'USER', entityId: ticket._id },
            });

            if (req.io) {
                req.io.to(ticket.userId.toString()).emit('newNotification');
                req.io.to(ticket.userId.toString()).emit('ticketChanged', {
                    ticketId: ticket._id,
                });
            }
        } catch (e) { console.error('Notif error:', e); }

        res.status(200).json({
            success: true,
            message: 'Ticket marked as in progress',
            ticket,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Resolve support ticket (admin)
// @route   PUT /api/admin/support/:id/resolve
// @access  Private (Admin)
exports.resolveTicket = async (req, res) => {
    try {
        const { resolution } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        ticket.resolution = resolution || ticket.resolution;
        ticket.status = 'RESOLVED';
        ticket.resolvedAt = new Date();
        ticket.assignedTo = req.user.id;

        if (resolution && resolution.trim()) {
            ticket.conversation.push({
                senderId: req.user.id,
                message: resolution.trim(),
                isInternal: false,
                sentAt: new Date(),
            });
        }

        await ticket.save();

        // ✅ Notify user
        try {
            await Notification.create({
                userId: ticket.userId,
                type: 'SYSTEM_UPDATE',
                title: 'Support Ticket Resolved ✅',
                message: `Your ticket "${ticket.subject}" has been resolved.`,
                link: `/support/${ticket._id}`,
                relatedEntity: { entityType: 'USER', entityId: ticket._id },
            });

            if (req.io) {
                req.io.to(ticket.userId.toString()).emit('newNotification');
                req.io.to(ticket.userId.toString()).emit('ticketChanged', {
                    ticketId: ticket._id,
                });
            }
        } catch (e) { console.error('Notif error:', e); }

        res.status(200).json({
            success: true,
            message: 'Ticket resolved',
            ticket,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};