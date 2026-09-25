const Proposal = require('../models/Proposal');
const Project = require('../models/Project');
const Conversation = require('../models/Conversation');

// @desc    Submit proposal
// @route   POST /api/proposals
// @access  Private (Freelancer only)
exports.submitProposal = async (req, res) => {
    try {
        const { projectId, coverLetter, bidAmount, estimatedTime } = req.body;

        // Validate
        if (!projectId || !coverLetter || !bidAmount || !estimatedTime) {
            return res.status(400).json({
                success: false,
                message: 'Please provide: projectId, coverLetter, bidAmount, estimatedTime'
            });
        }

        // Check if project exists and is open
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        if (project.status !== 'Open') {
            return res.status(400).json({
                success: false,
                message: 'This project is no longer accepting proposals'
            });
        }

        // Check if freelancer already submitted proposal
        const existingProposal = await Proposal.findOne({
            projectId,
            freelancerId: req.user.id
        });

        if (existingProposal) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted a proposal for this project'
            });
        }

        // Create proposal
        const proposal = await Proposal.create({
            projectId,
            freelancerId: req.user.id,
            coverLetter,
            bidAmount,
            estimatedTime,
            status: 'Pending'
        });

        // Increment proposals count on project
        await Project.findByIdAndUpdate(projectId, {
            $inc: { proposalsCount: 1 }
        });

        // ✅ Create PRE_HIRE conversation (if not already exists)
        const existingConv = await Conversation.findOne({
            participants: { $all: [project.clientId, req.user.id] },
            relatedProject: project._id
        });

        if (!existingConv) {
            await Conversation.create({
                participants: [project.clientId, req.user.id],
                relatedProject: project._id,
                chatMode: 'PRE_HIRE',
                isLocked: false
            });
        }

        res.status(201).json({
            success: true,
            message: 'Proposal submitted successfully',
            proposalId: proposal.proposalId,
            proposal
        });
    } catch (error) {
        console.error('Submit proposal error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error submitting proposal'
        });
    }
};

// @desc    Get proposals for a project
// @route   GET /api/proposals/project/:projectId
// @access  Private (Client who posted the project)
exports.getProjectProposals = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check if client owns the project
        if (project.clientId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view these proposals'
            });
        }

        const proposals = await Proposal.find({ projectId: req.params.projectId })
            .populate('freelancerId', 'name email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: proposals.length,
            proposals
        });
    } catch (error) {
        console.error('Get proposals error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching proposals'
        });
    }
};

// @desc    Get my proposals (Freelancer)
// @route   GET /api/proposals/my
// @access  Private (Freelancer only)
exports.getMyProposals = async (req, res) => {
    try {
        const proposals = await Proposal.find({ freelancerId: req.user.id })
            .populate('projectId', 'title budget category status')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: proposals.length,
            proposals
        });
    } catch (error) {
        console.error('Get my proposals error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching proposals'
        });
    }
};

// @desc    Accept proposal
// @route   PUT /api/proposals/:id/accept
// @access  Private (Client who posted the project)
exports.acceptProposal = async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id);

        if (!proposal) {
            return res.status(404).json({ success: false, message: 'Proposal not found' });
        }

        if (['Withdrawn', 'Rejected', 'Accepted'].includes(proposal.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot accept a proposal that is already ${proposal.status}`
            });
        }

        const project = await Project.findById(proposal.projectId);

        if (project.clientId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // ✅ Accept this one
        proposal.status = 'Accepted';
        await proposal.save();

        // ✅ Auto-reject all OTHER pending proposals for this project
        await Proposal.updateMany(
            {
                projectId: proposal.projectId,
                _id: { $ne: proposal._id },
                status: { $in: ['Pending', 'Interviewing'] },
            },
            { status: 'Rejected' }
        );

        // Update project
        project.status = 'In Progress';
        project.awardedTo = proposal.freelancerId;
        project.startDate = new Date();
        project.chatLocked = false;
        await project.save();

        // ✅ Upgrade conversation to POST_HIRE
        let conversation = await Conversation.findOne({
            participants: { $all: [project.clientId, proposal.freelancerId] },
            relatedProject: project._id
        });

        if (conversation) {
            conversation.chatMode = 'POST_HIRE';
            conversation.isLocked = false;
            conversation.lockedBy = null;
            conversation.lockedAt = null;
            conversation.lockReason = null;
            await conversation.save();
        } else {
            await Conversation.create({
                participants: [project.clientId, proposal.freelancerId],
                relatedProject: project._id,
                chatMode: 'POST_HIRE',
                isLocked: false
            });
        }

        res.status(200).json({
            success: true,
            message: 'Proposal accepted. Other proposals auto-rejected.',
            proposal
        });
    } catch (error) {
        console.error('Accept proposal error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reject proposal
// @route   PUT /api/proposals/:id/reject
// @access  Private (Client who posted the project)
exports.rejectProposal = async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id);

        if (!proposal) {
            return res.status(404).json({
                success: false,
                message: 'Proposal not found'
            });
        }

        if (['Withdrawn', 'Rejected', 'Accepted'].includes(proposal.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot reject a proposal that is already ${proposal.status}`
            });
        }

        const project = await Project.findById(proposal.projectId);

        // Check if client owns the project
        if (project.clientId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to reject this proposal'
            });
        }

        proposal.status = 'Rejected';
        await proposal.save();

        res.status(200).json({
            success: true,
            message: 'Proposal rejected successfully',
            proposal
        });
    } catch (error) {
        console.error('Reject proposal error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error rejecting proposal'
        });
    }
};

// @desc    Withdraw proposal (Freelancer)
// @route   PUT /api/proposals/:id/withdraw
// @access  Private (Freelancer who submitted)
exports.withdrawProposal = async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id);

        if (!proposal) {
            return res.status(404).json({
                success: false,
                message: 'Proposal not found'
            });
        }

        // Check if freelancer owns the proposal
        if (proposal.freelancerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to withdraw this proposal'
            });
        }

        if (['Accepted', 'Rejected', 'Withdrawn'].includes(proposal.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot withdraw a proposal that is already ${proposal.status}`
            });
        }

        proposal.status = 'Withdrawn';
        await proposal.save();

        res.status(200).json({
            success: true,
            message: 'Proposal withdrawn successfully',
            proposal
        });
    } catch (error) {
        console.error('Withdraw proposal error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error withdrawing proposal'
        });
    }
};

// @desc    Update proposal (freelancer only, while Pending)
// @route   PUT /api/proposals/:id
// @access  Private (Freelancer)
exports.updateProposal = async (req, res) => {
    try {
        const { coverLetter, bidAmount, estimatedTime } = req.body;
        const proposal = await Proposal.findById(req.params.id);

        if (!proposal) {
            return res.status(404).json({ success: false, message: 'Proposal not found' });
        }

        if (proposal.freelancerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (proposal.status !== 'Pending' && proposal.status !== 'Interviewing') {
            return res.status(400).json({
                success: false,
                message: `Cannot edit a proposal that is ${proposal.status}`
            });
        }

        if (coverLetter) proposal.coverLetter = coverLetter;
        if (bidAmount !== undefined) proposal.bidAmount = bidAmount;
        if (estimatedTime !== undefined) proposal.estimatedTime = estimatedTime;

        await proposal.save();

        res.status(200).json({
            success: true,
            message: 'Proposal updated successfully',
            proposal
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};