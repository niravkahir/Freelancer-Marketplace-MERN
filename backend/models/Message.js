const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
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
  readAt: Date,
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
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

module.exports = mongoose.model('Message', messageSchema);