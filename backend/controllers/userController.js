const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const Project = require('../models/Project');
const Review = require('../models/Review');
const cloudinary = require('../config/cloudinary');

// @desc    Get my own profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let profile = null;
        if (user.role === 'FREELANCER') {
            profile = await FreelancerProfile.findOne({ userId: user._id });
        } else if (user.role === 'CLIENT') {
            profile = await ClientProfile.findOne({ userId: user._id });
        }

        res.status(200).json({ success: true, user, profile });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update my profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, profilePicture } = req.body;

        // ✅ Fetch existing user to check old profile picture
        const existingUser = await User.findById(req.user.id);
        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // ✅ If new profile picture provided, delete old one from Cloudinary
        if (
            profilePicture &&
            existingUser.profilePicture &&
            existingUser.profilePicture !== profilePicture &&
            existingUser.profilePicture.includes('cloudinary')
        ) {
            try {
                // Extract publicId from URL
                // URL: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/file.jpg
                const urlParts = existingUser.profilePicture.split('/');
                const fileWithExt = urlParts[urlParts.length - 1];
                const fileName = fileWithExt.split('.')[0];
                const folder = urlParts[urlParts.length - 2];
                const publicId = `${folder}/${fileName}`;

                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.error('Old image delete error:', err);
                // Don't block the update if deletion fails
            }
        }

        // ✅ Update user basic fields
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, phone, profilePicture },
            { new: true, runValidators: true }
        ).select('-password');

        let profile = null;
        const {
            title, bio, skills, hourlyRate, experienceYears,
            portfolio, location, languages, education, certifications,
            isAvailable,
            companyName, companyWebsite, companyDescription,
            industry, companySize, verified
        } = req.body;

        if (user.role === 'FREELANCER') {
            profile = await FreelancerProfile.findOneAndUpdate(
                { userId: user._id },
                {
                    title, bio, skills, hourlyRate, experienceYears,
                    portfolio, location, languages, education, certifications,
                    isAvailable
                },
                { new: true, upsert: true, runValidators: true }
            );
        } else if (user.role === 'CLIENT') {
            profile = await ClientProfile.findOneAndUpdate(
                { userId: user._id },
                {
                    companyName, companyWebsite, companyDescription,
                    industry, companySize, verified
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get my projects (client)
// @route   GET /api/users/my-projects
// @access  Private (Client)
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
// @access  Private (Freelancer)
exports.getActiveProjects = async (req, res) => {
    try {
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get public profile of another user
// @route   GET /api/users/:id/profile
// @access  Public
// @desc    Get public profile of another user
// @route   GET /api/users/:id/profile
// @access  Public
// @desc    Get public profile of another user
// @route   GET /api/users/:id/profile
// @access  Public
exports.getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let profile = null;
        if (user.role === 'FREELANCER') {
            profile = await FreelancerProfile.findOne({ userId: user._id });
        } else if (user.role === 'CLIENT') {
            profile = await ClientProfile.findOne({ userId: user._id });
        }

        // ✅ Compute rating from reviews
        let rating = 0;
        let totalReviews = 0;

        if (user.role === 'FREELANCER') {
            const reviews = await Review.find({
                revieweeId: user._id,
                role: 'CLIENT_TO_FREELANCER'
            });
            totalReviews = reviews.length;
            rating = reviews.length > 0
                ? Math.round(
                    (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
                  ) / 10
                : (profile?.rating || 0);
        } else if (user.role === 'CLIENT') {
            const reviews = await Review.find({
                revieweeId: user._id,
                role: 'FREELANCER_TO_CLIENT'
            });
            totalReviews = reviews.length;
            rating = reviews.length > 0
                ? Math.round(
                    (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
                  ) / 10
                : 0;
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
            rating,
            totalReviews,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};