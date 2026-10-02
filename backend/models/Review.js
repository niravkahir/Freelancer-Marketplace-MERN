const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  role: {
    type: String,
    enum: ['CLIENT_TO_FREELANCER', 'FREELANCER_TO_CLIENT'],
    required: true
  }
}, { timestamps: true });

// One review per contract per reviewer
reviewSchema.index({ contractId: 1, reviewerId: 1 }, { unique: true });
reviewSchema.index({ revieweeId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);