const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    ticketId: {
        type: Number,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: [true, 'Please add a subject'],
        trim: true,
        maxlength: [100, 'Subject cannot be more than 100 characters']
    },
    category: {
        type: String,
        enum: [
            'ACCOUNT_ISSUE',
            'PAYMENT_ISSUE',
            'PROJECT_ISSUE',
            'TECHNICAL_ISSUE',
            'FEEDBACK',
            'COMPLAINT',
            'GENERAL_QUERY',
            'FEATURE_REQUEST',
            'BUG_REPORT'
        ],
        required: true
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        trim: true,
        maxlength: [5000, 'Description cannot be more than 5000 characters']
    },
    attachments: [{
        name: String,
        url: String,
        size: Number
    }],
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_RESPONSE', 'RESOLVED', 'CLOSED'],
        default: 'OPEN'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolution: {
        type: String,
        trim: true,
        maxlength: [2000, 'Resolution cannot be more than 2000 characters']
    },
    resolvedAt: {
        type: Date
    },
    closedAt: {
        type: Date
    },
    closedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    feedback: {
        type: String,
        trim: true,
        maxlength: [500, 'Feedback cannot be more than 500 characters']
    },
    conversation: [{
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        message: {
            type: String,
            trim: true
        },
        isInternal: {
            type: Boolean,
            default: false
        },
        sentAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

supportTicketSchema.index({ userId: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ category: 1 });

supportTicketSchema.pre('save', async function(next) {
    if (!this.isNew) return next();
    try {
        const last = await this.constructor.findOne({}, {}, { sort: { 'ticketId': -1 } });
        this.ticketId = last && last.ticketId ? last.ticketId + 1 : 8001;
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);