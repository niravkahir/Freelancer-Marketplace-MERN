const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
    generateDescription,
    suggestSkills
} = require('../controllers/aiController');
const { protect, isClient } = require('../middleware/auth');

const aiLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 5,              
    message: {
        success: false,
        message: 'Too many AI requests from this IP. Please try again after a minute.'
    },
    standardHeaders: true,
    legacyHeaders: false,  
});

router.post(
    '/generate-description', 
    protect,      
    isClient,    
    aiLimiter,    
    generateDescription
);

router.post(
    '/suggest-skills', 
    protect, 
    isClient, 
    aiLimiter, 
    suggestSkills
);

module.exports = router;