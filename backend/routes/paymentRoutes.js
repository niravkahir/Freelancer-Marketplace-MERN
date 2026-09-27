const express = require('express');
const router = express.Router();
const {
    createPayment,
    getMyPayments,
    getPaymentById,
    createRazorpayOrder,
    verifyRazorpayPayment,
    updatePaymentStatus
} = require('../controllers/paymentController');
const { protect, isClient } = require('../middleware/auth');

router.post('/', protect, createPayment);
router.get('/', protect, getMyPayments);

// ✅ Razorpay routes — MUST be before /:id
router.post('/create-order', protect, isClient, createRazorpayOrder);
router.post('/verify', protect, isClient, verifyRazorpayPayment);

router.get('/:id', protect, getPaymentById);
router.put('/:id/status', protect, updatePaymentStatus);

module.exports = router;