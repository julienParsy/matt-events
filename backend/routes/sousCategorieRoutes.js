// @feature categories — Routes /api/sous-categories
const express = require('express');
const router = express.Router();
const sousCategorieController = require('../controllers/sousCategorieController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Lecture publique (boutique) ; modifications réservées aux admins
router.get('/', sousCategorieController.getAllSousCategories);
router.post('/', verifyToken, isAdmin, sousCategorieController.createSousCategorie);
router.put('/:id', verifyToken, isAdmin, sousCategorieController.updateSousCategorie);
router.delete('/:id', verifyToken, isAdmin, sousCategorieController.deleteSousCategorie);

module.exports = router;
