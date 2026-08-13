const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    projectId: {
        type: Number,
        unique: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a project title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a project description'],
        trim: true,
        maxlength: [5000, 'Description cannot be more than 5000 characters']
    },
    budget: {
        type: Number,
        required: [true, 'Please add a budget'],
        min: [0, 'Budget cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        trim: true
    },
    subCategory: {
        type: String,
        trim: true
    },
    skillsRequired: [{
        type: String,
        trim: true,
        required: [true, 'Please add at least one required skill']
    }],
    experienceLevel: {
        type: String,
        enum: ['Entry', 'Intermediate', 'Expert'],
        default: 'Intermediate'
    },
    projectType: {
        type: String,
        enum: ['Fixed', 'Hourly'],
        default: 'Fixed'
    },
    deadline: {
        type: Date,
        required: [true, 'Please add a deadline']
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Completed', 'Cancelled', 'On Hold'],
        default: 'Open'
    },
    attachments: [{
        name: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    proposalsCount: {
        type: Number,
        default: 0,
        min: [0, 'Proposals count cannot be negative']
    },
    awardedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    startDate: {
        type: Date
    },
    completionDate: {
        type: Date
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for better search performance
projectSchema.index({ title: 'text', description: 'text' });
projectSchema.index({ category: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ budget: 1 });
projectSchema.index({ skillsRequired: 1 });

// Auto-increment projectId
projectSchema.pre('save', async function(next) {
    if (!this.isNew) {
        return next();
    }
    
    try {
        const lastProject = await this.constructor.findOne({}, {}, { sort: { 'projectId': -1 } });
        this.projectId = lastProject && lastProject.projectId ? lastProject.projectId + 1 : 101;
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Project', projectSchema);