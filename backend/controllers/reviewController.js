const Review = require('../models/Review');
const Contract = require('../models/Contract');
const FreelancerProfile = require('../models/FreelancerProfile');
const Notification = require('../models/Notification');

// @desc    Submit review after contract completion
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
    try {
        const { contractId, rating, comment } = req.body;

        if (!contractId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'contractId and rating are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const contract = await Contract.findById(contractId);
        if (!contract) {
            return res.status(404).json({ success: false, message: 'Contract not found' });
        }

        if (contract.status !== 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'Only completed contracts can be reviewed'
            });
        }

        const isClient = contract.clientId.toString() === req.user.id;
        const isFreelancer = contract.freelancerId.toString() === req.user.id;

        if (!isClient && !isFreelancer) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Prevent duplicate review
        const existing = await Review.findOne({
            contractId,
            reviewerId: req.user.id
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'You already reviewed this contract'
            });
        }

        const revieweeId = isClient ? contract.freelancerId : contract.clientId;
        const role = isClient ? 'CLIENT_TO_FREELANCER' : 'FREELANCER_TO_CLIENT';

        const review = await Review.create({
            contractId,
            projectId: contract.projectId,
            reviewerId: req.user.id,
            revieweeId,
            rating,
            comment: comment || '',
            role
        });

        // ✅ If reviewing freelancer → update their average rating
        if (isClient) {
            const allReviews = await Review.find({
                revieweeId: contract.freelancerId,
                role: 'CLIENT_TO_FREELANCER'
            });
            const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
            const rounded = Math.round(avg * 10) / 10;

            await FreelancerProfile.findOneAndUpdate(
                { userId: contract.freelancerId },
                { rating: rounded },
                { upsert: true }
            );
        }

        // ✅ Notify reviewee
        try {
            await Notification.create({
                userId: revieweeId,
                type: 'SYSTEM_UPDATE',
                title: 'New Review Received ⭐',
                message: `You received a ${rating}-star review.`,
                link: `/users/${revieweeId}`,
                relatedEntity: { entityType: 'USER', entityId: revieweeId }
            });

            if (req.io) {
                req.io.to(revieweeId.toString()).emit('newNotification');
            }
        } catch (e) { console.error('Notif error:', e); }

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get reviews for a user (public)
// @route   GET /api/reviews/user/:userId
// @access  Public
exports.getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ revieweeId: req.params.userId })
            .populate('reviewerId', 'name profilePicture')
            .populate('projectId', 'title')
            .sort({ createdAt: -1 });

        const avg = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        res.status(200).json({
            success: true,
            count: reviews.length,
            averageRating: Math.round(avg * 10) / 10,
            reviews
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get my submitted reviews
// @route   GET /api/reviews/my
// @access  Private
exports.getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ reviewerId: req.user.id })
            .populate('revieweeId', 'name')
            .populate('projectId', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Check if I already reviewed a contract
// @route   GET /api/reviews/contract/:contractId/me
// @access  Private
exports.getMyContractReview = async (req, res) => {
    try {
        const review = await Review.findOne({
            contractId: req.params.contractId,
            reviewerId: req.user.id
        });
        res.status(200).json({ success: true, review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all reviews for a contract
// @route   GET /api/reviews/contract/:contractId
// @access  Private (participant)
exports.getContractReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ contractId: req.params.contractId })
            .populate('reviewerId', 'name')
            .populate('revieweeId', 'name');
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};