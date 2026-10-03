const cloudinary = require('../config/cloudinary');

// @desc    Upload profile picture
// @route   POST /api/upload/profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            url: req.file.path,           // ✅ Cloudinary URL
            publicId: req.file.filename,  // ✅ For deletion later
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete an image from Cloudinary
// @route   DELETE /api/upload/:publicId
// @access  Private
exports.deleteImage = async (req, res) => {
    try {
        const publicId = req.params.publicId;

        // publicId may contain "/" — replace encoded ones
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            return res.status(200).json({
                success: true,
                message: 'Image deleted',
            });
        }

        res.status(400).json({
            success: false,
            message: 'Failed to delete image',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};