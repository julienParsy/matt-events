// @feature pages — Routes /api/pages
const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Lecture (public)
router.get('/:slug', pageController.getPage);

// Modification (admin seulement)
router.put('/:slug', verifyToken, isAdmin, pageController.updatePage);

// Ajout d'une page
router.post('/', verifyToken, isAdmin, pageController.createPage);

module.exports = router;
