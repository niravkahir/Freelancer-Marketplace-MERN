const express = require('express');
const router = express.Router();
const {
    createPayment,
    getMyPayments,
    getPaymentById,
    updatePaymentStatus
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createPayment);
router.get('/', protect, getMyPayments);
router.get('/:id', protect, getPaymentById);
router.put('/:id/status', protect, updatePaymentStatus);

module.exports = router;