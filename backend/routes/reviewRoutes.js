const express = require('express');
const router = express.Router();
const {
    createReview,
    getUserReviews,
    getMyReviews,
    getMyContractReview,
    getContractReviews
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/my', protect, getMyReviews);
router.get('/contract/:contractId/me', protect, getMyContractReview);
router.get('/contract/:contractId', protect, getContractReviews);
router.get('/user/:userId', getUserReviews);

module.exports = router;