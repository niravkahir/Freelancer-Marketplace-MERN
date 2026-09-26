const express = require('express');
const router = express.Router();
const {
    createContract,
    getMyContracts,
    getContractById,
    signContract,
    completeContract
} = require('../controllers/contractController');
const { protect, isClient } = require('../middleware/auth');

router.post('/', protect, isClient, createContract);
router.get('/', protect, getMyContracts);
router.get('/:id', protect, getContractById);
router.put('/:id/sign', protect, signContract);
router.put('/:id/complete', protect, isClient, completeContract);

module.exports = router;