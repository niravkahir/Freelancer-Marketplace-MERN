const express = require('express');
const router = express.Router();
const {
    getStats,
    getAllUsers,
    toggleBlockUser,
    deleteUser,
    getAllProjects,
    deleteProject,
    getAllTickets,
    markTicketInProgress,
    resolveTicket,
    // NEW
    createSkill,
    getAllSkills,
    deleteSkill,
    createCategory,
    getAllCategories,
    deleteCategory,
    toggleVerifyClient,
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/auth');

router.use(protect, isAdmin);

// Stats
router.get('/stats', getStats);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id/block', toggleBlockUser);
router.put('/users/:id/verify', toggleVerifyClient);
router.delete('/users/:id', deleteUser);

// Projects
router.get('/projects', getAllProjects);
router.delete('/projects/:id', deleteProject);

// Support
router.get('/support', getAllTickets);
router.put('/support/:id/in-progress', markTicketInProgress);
router.put('/support/:id/resolve', resolveTicket);

// Skills
router.get('/skills', getAllSkills);
router.post('/skills', createSkill);
router.delete('/skills/:id', deleteSkill);

// Categories
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;