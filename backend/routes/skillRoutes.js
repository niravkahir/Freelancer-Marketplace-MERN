const express = require('express');
const router = express.Router();
const {
    createSkill,
    getAllSkills,
    getSkillById,
    searchSkills
} = require('../controllers/skillController');
const { protect, isAdmin } = require('../middleware/auth');

router.get('/', getAllSkills);
router.get('/search', searchSkills);
router.get('/:id', getSkillById);
router.post('/', protect, isAdmin, createSkill);

module.exports = router;