const express = require('express');
const router = express.Router();
const {
    createContract,
    getMyContracts,
    getContractById,
    signContract
} = require('../controllers/contractController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createContract);
router.get('/', protect, getMyContracts);
router.get('/:id', protect, getContractById);
router.put('/:id/sign', protect, signContract);

module.exports = router;