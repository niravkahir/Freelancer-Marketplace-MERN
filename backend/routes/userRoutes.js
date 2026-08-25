const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    getMyProjects,
    getActiveProjects
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/my-projects', protect, getMyProjects);
router.get('/active-projects', protect, getActiveProjects);

module.exports = router;