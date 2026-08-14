const express = require('express');
const router = express.Router();
const {
    createTicket,
    getMyTickets,
    getTicketById,
    addReply,
    closeTicket
} = require('../controllers/supportController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createTicket);
router.get('/', protect, getMyTickets);
router.get('/:id', protect, getTicketById);
router.post('/:id/reply', protect, addReply);
router.put('/:id/close', protect, closeTicket);

module.exports = router;