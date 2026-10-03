const express = require('express');
const router = express.Router();
const {
    uploadProfilePicture,
    deleteImage,
} = require('../controllers/uploadController');
const { uploadProfile } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

router.post(
    '/profile-picture',
    protect,
    uploadProfile.single('image'),   // field name = "image"
    uploadProfilePicture
);

router.delete('/:publicId', protect, deleteImage);

module.exports = router;