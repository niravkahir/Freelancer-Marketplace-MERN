const express = require('express');
const router = express.Router();
const {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
    searchProjects
} = require('../controllers/projectController');
const { protect, isClient } = require('../middleware/auth');

// ✅ Public routes (no authentication needed)
router.get('/', getAllProjects);
router.get('/search', searchProjects);
router.get('/:id', getProjectById);

// ✅ Protected routes (need authentication)
router.post('/', protect, isClient, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

module.exports = router;