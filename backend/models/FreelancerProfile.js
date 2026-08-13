const mongoose = require('mongoose');

const freelancerProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true  // One-to-one relationship
    },
    title: {
        type: String,
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [1000, 'Bio cannot be more than 1000 characters']
    },
    skills: [{
        type: String,
        trim: true
    }],
    hourlyRate: {
        type: Number,
        min: [0, 'Hourly rate cannot be negative']
    },
    experienceYears: {
        type: Number,
        min: [0, 'Experience cannot be negative'],
        max: [50, 'Experience cannot be more than 50 years']
    },
    portfolio: [{
        title: String,
        description: String,
        link: String,
        image: String
    }],
    rating: {
        type: Number,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5'],
        default: 0
    },
    totalEarnings: {
        type: Number,
        default: 0,
        min: [0, 'Total earnings cannot be negative']
    },
    projectsCompleted: {
        type: Number,
        default: 0,
        min: [0, 'Projects completed cannot be negative']
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    location: {
        type: String,
        trim: true
    },
    languages: [{
        type: String,
        trim: true
    }],
    education: [{
        degree: String,
        institution: String,
        year: Number
    }],
    certifications: [{
        name: String,
        issuer: String,
        year: Number
    }]
}, {
    timestamps: true
});

// Index for better search performance
freelancerProfileSchema.index({ skills: 1 });
freelancerProfileSchema.index({ rating: -1 });
freelancerProfileSchema.index({ hourlyRate: 1 });

module.exports = mongoose.model('FreelancerProfile', freelancerProfileSchema);