const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a skill name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Skill name cannot be more than 50 characters']
    },
    category: {
        type: String,
        required: [true, 'Please add a skill category'],
        trim: true,
        enum: [
            'PROGRAMMING',
            'DESIGN',
            'MARKETING',
            'WRITING',
            'MANAGEMENT',
            'DATA_SCIENCE',
            'AI_ML',
            'CLOUD_COMPUTING',
            'CYBERSECURITY',
            'DEVOPS',
            'MOBILE_DEVELOPMENT',
            'WEB_DEVELOPMENT',
            'SOFTWARE_TESTING',
            'BUSINESS_ANALYSIS',
            'PROJECT_MANAGEMENT',
            'OTHER'
        ]
    },
    subCategory: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    popularity: {
        type: Number,
        default: 0,
        min: [0, 'Popularity cannot be negative']
    },
    icon: {
        type: String
    },
    tags: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

skillSchema.index({ name: 'text' });
skillSchema.index({ category: 1 });
skillSchema.index({ popularity: -1 });

module.exports = mongoose.model('Skill', skillSchema);