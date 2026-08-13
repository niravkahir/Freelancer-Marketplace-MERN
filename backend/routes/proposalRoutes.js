const express = require('express');
const router = express.Router();
const {
    submitProposal,
    getProjectProposals,
    getMyProposals,
    acceptProposal,
    rejectProposal,
    withdrawProposal
} = require('../controllers/proposalController');
const { protect, isFreelancer } = require('../middleware/auth');

// ✅ All routes need authentication
router.post('/', protect, isFreelancer, submitProposal);
router.get('/my', protect, isFreelancer, getMyProposals);
router.get('/project/:projectId', protect, getProjectProposals);
router.put('/:id/accept', protect, acceptProposal);
router.put('/:id/reject', protect, rejectProposal);
router.put('/:id/withdraw', protect, isFreelancer, withdrawProposal);

module.exports = router;