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
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/auth');

router.use(protect, isAdmin);

router.get('/stats', getStats);

router.get('/users', getAllUsers);
router.put('/users/:id/block', toggleBlockUser);
router.delete('/users/:id', deleteUser);

router.get('/projects', getAllProjects);
router.delete('/projects/:id', deleteProject);

router.get('/support', getAllTickets);
router.put('/support/:id/in-progress', markTicketInProgress);
router.put('/support/:id/resolve', resolveTicket);

module.exports = router;