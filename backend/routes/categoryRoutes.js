const express = require('express');
const router = express.Router();
const { getCategories, addCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');

const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Route publique
router.get('/', getCategories);
router.post('/', verifyToken, isAdmin, addCategory);
router.put('/:id', verifyToken, isAdmin, updateCategory);
router.delete('/:id', verifyToken, isAdmin, deleteCategory);

module.exports = router;
