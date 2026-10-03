const User = require('../models/User');
const Project = require('../models/Project');
const Contract = require('../models/Contract');
const Payment = require('../models/Payment');
const SupportTicket = require('../models/SupportTicket');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const Notification = require('../models/Notification');
const Skill = require('../models/Skill');
const Category = require('../models/Category');

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
            .select('_id name email role createdAt')
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
        console.error('Get stats error:', error);
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

        const usersWithVerified = await Promise.all(
            users.map(async (u) => {
                if (u.role === 'CLIENT') {
                    const profile = await ClientProfile.findOne({ userId: u._id });
                    return { ...u.toObject(), isVerified: profile?.verified || false };
                }
                return u.toObject();
            })
        );

        res.status(200).json({
            success: true,
            count: usersWithVerified.length,
            users: usersWithVerified,
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

// @desc    Create skill
// @route   POST /api/admin/skills
// @access  Private (Admin)
exports.createSkill = async (req, res) => {
    try {
        const { name, category, description } = req.body;

        if (!name || !category) {
            return res.status(400).json({ success: false, message: 'Name and category required' });
        }

        const existing = await Skill.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Skill already exists' });
        }

        const skill = await Skill.create({ name, category, description });

        res.status(201).json({ success: true, message: 'Skill added', skill });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all skills
// @route   GET /api/admin/skills
// @access  Private (Admin)
exports.getAllSkills = async (req, res) => {
    try {
        const skills = await Skill.find().sort({ name: 1 });
        res.status(200).json({ success: true, count: skills.length, skills });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete skill
// @route   DELETE /api/admin/skills/:id
// @access  Private (Admin)
exports.deleteSkill = async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);
        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }
        await skill.deleteOne();
        res.status(200).json({ success: true, message: 'Skill deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================== CATEGORIES ==================

// @desc    Create category
// @route   POST /api/admin/categories
// @access  Private (Admin)
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Name required' });
        }

        const existing = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }

        const category = await Category.create({ name, description });

        res.status(201).json({ success: true, message: 'Category added', category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private (Admin)
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.status(200).json({ success: true, count: categories.length, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        await category.deleteOne();
        res.status(200).json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================== CLIENT VERIFY ==================

// @desc    Toggle client verification
// @route   PUT /api/admin/users/:id/verify
// @access  Private (Admin)
exports.toggleVerifyClient = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'CLIENT') {
            return res.status(400).json({ success: false, message: 'Only clients can be verified' });
        }

        const profile = await ClientProfile.findOne({ userId: user._id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Client profile not found' });
        }

        profile.verified = !profile.verified;
        await profile.save();

        // Notify user
        try {
            await Notification.create({
                userId: user._id,
                type: profile.verified ? 'USER_UNBLOCKED' : 'SYSTEM_UPDATE',
                title: profile.verified ? 'Account Verified ✅' : 'Verification Removed',
                message: profile.verified
                    ? 'Your account is verified. You can now post projects.'
                    : 'Your verification has been removed.',
                link: '/profile',
            });

            if (req.io) {
                req.io.to(user._id.toString()).emit('newNotification');
            }
        } catch (e) {}

        res.status(200).json({
            success: true,
            message: profile.verified ? 'Client verified' : 'Verification removed',
            verified: profile.verified,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};