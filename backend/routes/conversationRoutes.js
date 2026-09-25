const express = require('express');
const router = express.Router();
const {
    getOrCreateConversation,
    getMyConversations,
    getConversationById,
    lockConversation,
    unlockConversation
} = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');

router.post('/', protect, getOrCreateConversation);
router.get('/', protect, getMyConversations);
router.get('/:id', protect, getConversationById);
router.put('/:id/lock', protect, lockConversation);
router.put('/:id/unlock', protect, unlockConversation);

module.exports = router;