const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'PROPOSAL_SUBMITTED',
            'PROPOSAL_ACCEPTED',
            'PROPOSAL_REJECTED',
            'PROJECT_POSTED',
            'PROJECT_COMPLETED',
            'MESSAGE_RECEIVED',
            'PAYMENT_RECEIVED',
            'PAYMENT_SENT',
            'HIRING_COMPLETED',
            'NEW_MILESTONE',
            'MILESTONE_COMPLETED',
            'USER_BLOCKED',
            'USER_UNBLOCKED',
            'SYSTEM_UPDATE',
            'PROJECT_DEADLINE_REMINDER'
        ],
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a notification title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    message: {
        type: String,
        required: [true, 'Please add a notification message'],
        trim: true,
        maxlength: [500, 'Message cannot be more than 500 characters']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    link: {
        type: String,
        trim: true
    },
    relatedEntity: {
        entityType: {
            type: String,
            enum: ['PROJECT', 'PROPOSAL', 'MESSAGE', 'PAYMENT', 'USER']
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId
        }
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);