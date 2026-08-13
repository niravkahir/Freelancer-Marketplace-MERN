const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    // ✅ Added conversationId field
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxlength: [5000, 'Message cannot be more than 5000 characters']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'file', 'document']
        },
        url: String,
        name: String,
        size: Number
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedForSender: {
        type: Boolean,
        default: false
    },
    deletedForReceiver: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for performance
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ receiverId: 1, isRead: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ conversationId: 1 });

// ✅ Fixed: Virtual to generate conversation ID if not provided
messageSchema.virtual('generatedConversationId').get(function() {
    if (this.conversationId) {
        return this.conversationId;
    }
    return [this.senderId.toString(), this.receiverId.toString()].sort().join('_');
});

module.exports = mongoose.model('Message', messageSchema);