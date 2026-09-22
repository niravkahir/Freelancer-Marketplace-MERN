const Project = require('../models/Project');
const User = require('../models/User');

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

        if (new Date(deadline) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Deadline must be a future date'
            });
        }

        // Validate required fields
        if (!title || !description || !budget || !category || !skillsRequired || !deadline) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: title, description, budget, category, skillsRequired, deadline'
            });
        }

        // Create project
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

        let query;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            query = { _id: id };              // ObjectId
        } else {
            query = { projectId: Number(id) }; // Numeric
        }

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
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
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