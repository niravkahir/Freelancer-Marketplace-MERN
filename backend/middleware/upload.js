const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// ✅ Profile picture storage
const profileStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'freelancer-marketplace/profiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
        ],
    },
});

// ✅ Generic image storage (for future: project attachments, etc.)
const imageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'freelancer-marketplace/images',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ quality: 'auto' }],
    },
});

// ✅ File size limit: 5MB
const limits = { fileSize: 5 * 1024 * 1024 };

const uploadProfile = multer({
    storage: profileStorage,
    limits,
});

const uploadImage = multer({
    storage: imageStorage,
    limits,
});

module.exports = { uploadProfile, uploadImage };