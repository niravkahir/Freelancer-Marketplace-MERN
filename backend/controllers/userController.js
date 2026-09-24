const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const Project = require('../models/Project');

// @desc    Get user profile with role-specific details
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let profile = null;
        if (user.role === 'FREELANCER') {
            profile = await FreelancerProfile.findOne({ userId: user._id });
        } else if (user.role === 'CLIENT') {
            profile = await ClientProfile.findOne({ userId: user._id });
        }

        res.status(200).json({
            success: true,
            user,
            profile
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, profilePicture } = req.body;

        // Update User basic info
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, phone, profilePicture },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update role-specific profile
        let profile = null;
        const { 
            // Freelancer fields
            title, bio, skills, hourlyRate, experienceYears, 
            portfolio, location, languages, education, certifications,
            isAvailable,
            // Client fields
            companyName, companyWebsite, companyDescription, 
            industry, companySize, verified
        } = req.body;

        if (user.role === 'FREELANCER') {
            profile = await FreelancerProfile.findOneAndUpdate(
                { userId: user._id },
                {
                    title,
                    bio,
                    skills,
                    hourlyRate,
                    experienceYears,
                    portfolio,
                    location,
                    languages,
                    education,
                    certifications,
                    isAvailable
                },
                { new: true, upsert: true, runValidators: true }
            );
        } else if (user.role === 'CLIENT') {
            profile = await ClientProfile.findOneAndUpdate(
                { userId: user._id },
                {
                    companyName,
                    companyWebsite,
                    companyDescription,
                    industry,
                    companySize,
                    verified
                },
                { new: true, upsert: true, runValidators: true }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user,
            profile
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Get projects posted by client
// @route   GET /api/users/my-projects
// @access  Private (Client only)
exports.getMyProjects = async (req, res) => {
    try {
        if (req.user.role !== 'CLIENT') {
            return res.status(403).json({
                success: false,
                message: 'Only clients can view their projects'
            });
        }

        const projects = await Project.find({ clientId: req.user.id })
            .populate('awardedTo', 'name email')
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

// @desc    Get active projects for freelancer
// @route   GET /api/users/active-projects
// @access  Private (Freelancer only)
exports.getActiveProjects = async (req, res) => {
    try {
        // Check if user is freelancer
        if (req.user.role !== 'FREELANCER') {
            return res.status(403).json({
                success: false,
                message: 'Only freelancers can view their active projects'
            });
        }

        const projects = await Project.find({ 
            awardedTo: req.user.id,
            status: { $in: ['In Progress', 'Open'] }
        })
        .populate('clientId', 'name email')
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        console.error('Get active projects error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Get another user's public profile
// @route   GET /api/users/:id/profile
// @access  Public
exports.getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-password -resetPasswordToken -resetPasswordExpire');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let profile = null;
        if (user.role === 'FREELANCER') {
            profile = await FreelancerProfile.findOne({ userId: user._id });
        } else if (user.role === 'CLIENT') {
            profile = await ClientProfile.findOne({ userId: user._id });
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt,
            },
            profile,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};