const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
    contractId: {
        type: Number,
        unique: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    proposalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proposal',
        required: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    freelancerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a contract title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a contract description'],
        trim: true,
        maxlength: [5000, 'Description cannot be more than 5000 characters']
    },
    budget: {
        type: Number,
        required: [true, 'Please add a budget'],
        min: [0, 'Budget cannot be negative']
    },
    startDate: {
        type: Date,
        required: [true, 'Please add a start date']
    },
    endDate: {
        type: Date,
        required: [true, 'Please add an end date']
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'TERMINATED'],
        default: 'PENDING'
    },
    milestones: [{
        title: String,
        description: String,
        amount: Number,
        dueDate: Date,
        status: {
            type: String,
            enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED'],
            default: 'PENDING'
        },
        completedAt: Date
    }],
    terms: {
        type: String,
        trim: true,
        maxlength: [5000, 'Terms cannot be more than 5000 characters']
    },
    attachments: [{
        name: String,
        url: String
    }],
    signedByClient: {
        type: Boolean,
        default: false
    },
    signedByFreelancer: {
        type: Boolean,
        default: false
    },
    signedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    cancellationReason: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

contractSchema.index({ clientId: 1 });
contractSchema.index({ freelancerId: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ projectId: 1 });

contractSchema.pre('save', async function(next) {
    if (!this.isNew) return next();
    try {
        const last = await this.constructor.findOne({}, {}, { sort: { 'contractId': -1 } });
        this.contractId = last && last.contractId ? last.contractId + 1 : 5001;
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Contract', contractSchema);