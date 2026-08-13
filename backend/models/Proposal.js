const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
    proposalId: {
        type: Number,
        unique: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    freelancerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coverLetter: {
        type: String,
        required: [true, 'Please add a cover letter'],
        trim: true,
        maxlength: [5000, 'Cover letter cannot be more than 5000 characters']
    },
    bidAmount: {
        type: Number,
        required: [true, 'Please add a bid amount'],
        min: [0, 'Bid amount cannot be negative']
    },
    estimatedTime: {
        type: Number,  // In days
        required: [true, 'Please add estimated time'],
        min: [1, 'Estimated time must be at least 1 day']
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Withdrawn', 'Interviewing'],
        default: 'Pending'
    },
    attachment: {
        type: String
    },
    milestones: [{
        title: String,
        description: String,
        amount: Number,
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Completed', 'Approved'],
            default: 'Pending'
        }
    }],
    clientFeedback: {
        type: String,
        trim: true,
        maxlength: [1000, 'Feedback cannot be more than 1000 characters']
    },
    clientRating: {
        type: Number,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5']
    },
    viewedByClient: {
        type: Boolean,
        default: false
    },
    viewedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for performance
proposalSchema.index({ projectId: 1 });
proposalSchema.index({ freelancerId: 1 });
proposalSchema.index({ status: 1 });
proposalSchema.index({ bidAmount: 1 });

// Prevent duplicate proposals for the same project
proposalSchema.index({ projectId: 1, freelancerId: 1 }, { unique: true });

// Auto-increment proposalId
proposalSchema.pre('save', async function(next) {
    if (!this.isNew) {
        return next();
    }
    
    try {
        const lastProposal = await this.constructor.findOne({}, {}, { sort: { 'proposalId': -1 } });
        this.proposalId = lastProposal && lastProposal.proposalId ? lastProposal.proposalId + 1 : 201;
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Proposal', proposalSchema);