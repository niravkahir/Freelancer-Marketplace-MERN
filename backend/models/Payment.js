const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentId: {
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
    amount: {
        type: Number,
        required: [true, 'Please add payment amount'],
        min: [0, 'Amount cannot be negative']
    },
    paymentType: {
        type: String,
        enum: ['FIXED', 'HOURLY', 'MILESTONE'],
        default: 'FIXED'
    },
    paymentMethod: {
        type: String,
        enum: ['STRIPE', 'PAYPAL', 'RAZORPAY', 'BANK_TRANSFER', 'ESCROW'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'],
        default: 'PENDING'
    },
    transactionId: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    completionDate: {
        type: Date
    },
    refundDate: {
        type: Date
    },
    refundReason: {
        type: String,
        trim: true
    },
    currency: {
        type: String,
        default: 'USD',
        uppercase: true
    },
    isEscrow: {
        type: Boolean,
        default: false
    },
    releasedFromEscrow: {
        type: Boolean,
        default: false
    },
    escrowReleaseDate: {
        type: Date
    }
}, {
    timestamps: true
});

paymentSchema.index({ projectId: 1 });
paymentSchema.index({ freelancerId: 1 });
paymentSchema.index({ clientId: 1 });
paymentSchema.index({ status: 1 });

paymentSchema.pre('save', async function(next) {
    if (!this.isNew) return next();
    try {
        const last = await this.constructor.findOne({}, {}, { sort: { 'paymentId': -1 } });
        this.paymentId = last && last.paymentId ? last.paymentId + 1 : 1001;
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Payment', paymentSchema);