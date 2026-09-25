const Project = require('../models/Project');
const User = require('../models/User');
const ClientProfile = require('../models/ClientProfile');
const Conversation = require('../models/Conversation');
const Payment = require('../models/Payment');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Client only)
exports.createProject = async (req, res) => {
    try {
        const {
            title,
            description,
            budget,
            category,
            subCategory,
            skillsRequired,
            experienceLevel,
            projectType,
            deadline
        } = req.body;

        if (!title || !description || !budget || !category || !skillsRequired || !deadline) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (new Date(deadline) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Deadline must be a future date'
            });
        }

        const project = await Project.create({
            clientId: req.user.id,
            title,
            description,
            budget,
            category,
            subCategory: subCategory || '',
            skillsRequired,
            experienceLevel: experienceLevel || 'Intermediate',
            projectType: projectType || 'Fixed',
            deadline,
            status: 'Open'
        });

        // ✅ UPDATE CLIENT PROFILE STATS
        const allProjects = await Project.find({ clientId: req.user.id });
        const totalBudget = allProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
        const avgBudget = allProjects.length > 0 
            ? Math.round(totalBudget / allProjects.length) 
            : 0;

        await ClientProfile.findOneAndUpdate(
            { userId: req.user.id },
            {
                totalProjectsPosted: allProjects.length,
                averageBudget: avgBudget
            },
            { upsert: true, new: true }
        );

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            projectId: project.projectId,
            project
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error creating project'
        });
    }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find({ status: 'Open' })
            .populate('clientId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching projects'
        });
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('Fetching project with ID:', id, 'Length:', id.length);

        // Check if it's a valid 24-char hex ObjectId
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        const isNumber = /^\d+$/.test(id);

        if (!isObjectId && !isNumber) {
            return res.status(400).json({
                success: false,
                message: `Invalid project ID: "${id}" (length ${id.length}). Must be 24-char ObjectId or number.`
            });
        }

        const query = isObjectId
            ? { _id: id }
            : { projectId: Number(id) };

        const project = await Project.findOne(query)
            .populate('clientId', 'name email phone');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.status(200).json({ success: true, project });
    } catch (error) {
        console.error('getProjectById error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Client who created it)
exports.updateProject = async (req, res) => {
    try {
        let project = await Project.findOne({ projectId: req.params.id });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check ownership
        if (project.clientId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this project'
            });
        }

        project = await Project.findOneAndUpdate(
            { projectId: req.params.id },
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            project
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error updating project'
        });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Client who created it or Admin)
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findOne({ projectId: req.params.id });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check ownership
        if (project.clientId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this project'
            });
        }

        await project.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error deleting project'
        });
    }
};

// @desc    Search projects
// @route   GET /api/projects/search
// @access  Public
exports.searchProjects = async (req, res) => {
    try {
        const { keyword, category, minBudget, maxBudget, status } = req.query;

        const filter = {};

        if (keyword) {
            filter.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { skillsRequired: { $in: [new RegExp(keyword, 'i')] } }
            ];
        }
        if (category) filter.category = category;
        if (status) filter.status = status;
        if (minBudget) filter.budget = { $gte: parseInt(minBudget) };
        if (maxBudget) filter.budget = { ...filter.budget, $lte: parseInt(maxBudget) };

        const projects = await Project.find(filter)
            .populate('clientId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark project as completed
// @route   PUT /api/projects/:id/complete
// @access  Private (Client owner)
exports.markProjectCompleted = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (project.clientId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        project.status = 'Completed';
        project.completionDate = new Date();
        await project.save();

        // ✅ If payment is already completed → lock chat
        const payment = await Payment.findOne({
            projectId: project._id,
            status: 'COMPLETED'
        });

        if (payment) {
            project.chatLocked = true;
            await project.save();

            await Conversation.findOneAndUpdate(
                { relatedProject: project._id },
                {
                    isLocked: true,
                    lockedBy: req.user.id,
                    lockedAt: new Date(),
                    lockReason: 'PROJECT_COMPLETED'
                }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Project marked as completed',
            project
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};