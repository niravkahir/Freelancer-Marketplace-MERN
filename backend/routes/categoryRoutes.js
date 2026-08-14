// const express = require('express');
// const router = express.Router();
// const {
//     createCategory,
//     getAllCategories,
//     getCategoryById,
//     getCategoryBySlug,
//     updateCategory,
//     deleteCategory
// } = require('../controllers/categoryController');
// const { protect, isAdmin } = require('../middleware/auth');

// router.get('/', getAllCategories);
// router.get('/slug/:slug', getCategoryBySlug);
// router.get('/:id', getCategoryById);
// router.post('/', protect, isAdmin, createCategory);
// router.put('/:id', protect, isAdmin, updateCategory);
// router.delete('/:id', protect, isAdmin, deleteCategory);

// module.exports = router;

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Categories route working' });
});

module.exports = router;