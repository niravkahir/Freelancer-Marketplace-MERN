const mongoose = require('mongoose');

const clientProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true  // One-to-one relationship
    },
    companyName: {
        type: String,
        trim: true,
        maxlength: [100, 'Company name cannot be more than 100 characters']
    },
    companyWebsite: {
        type: String,
        trim: true,
        match: [
            /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
            'Please add a valid website URL'
        ]
    },
    companyDescription: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    industry: {
        type: String,
        trim: true
    },
    companySize: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
        default: '1-10'
    },
    location: {
        type: String,
        trim: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    totalProjectsPosted: {
        type: Number,
        default: 0,
        min: [0, 'Total projects cannot be negative']
    },
    averageBudget: {
        type: Number,
        default: 0,
        min: [0, 'Average budget cannot be negative']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ClientProfile', clientProfileSchema);