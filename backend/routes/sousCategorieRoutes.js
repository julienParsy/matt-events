// src/routes/sousCategorieRoutes.js
const express = require('express');
const router = express.Router();
const sousCategorieController = require('../controllers/sousCategorieController');

router.get('/', sousCategorieController.getAllSousCategories);
router.post('/', sousCategorieController.createSousCategorie);

module.exports = router;
