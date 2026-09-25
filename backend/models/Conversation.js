const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],

  relatedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },

  chatMode: {
    type: String,
    enum: ['PRE_HIRE', 'POST_HIRE'],
    default: 'PRE_HIRE'
  },

  isLocked: {
    type: Boolean,
    default: false
  },

  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  lockedAt: {
    type: Date,
    default: null
  },

  // ✅ Allow null OR one of the enum values
  lockReason: {
    type: String,
    enum: ['CLIENT_STOPPED', 'PROJECT_COMPLETED', null],
    default: null
  },

  lastMessage: {
    content: String,
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  },

  unreadCounts: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }]

}, { timestamps: true });

conversationSchema.index({ participants: 1 });
conversationSchema.index({ relatedProject: 1 });
conversationSchema.index({ 'lastMessage.sentAt': -1 });

module.exports = mongoose.model('Conversation', conversationSchema);