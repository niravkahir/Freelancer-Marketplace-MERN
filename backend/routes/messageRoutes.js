const express = require('express');
const router = express.Router();
const {
    sendMessage,
    markConversationRead,
    getUnreadCount
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.post('/', protect, sendMessage);
router.get('/unread-count', protect, getUnreadCount);
router.put('/conversation/:id/read', protect, markConversationRead);

module.exports = router;