// backend/routes/factureRoutes.js
const express = require('express');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const factureController = require('../controllers/factureController');

const router = express.Router();
router.use(verifyToken, isAdmin);

router.get('/', factureController.list);
router.post('/apercu', factureController.apercu);
router.get('/:id', factureController.get);
router.get('/:id/pdf', factureController.pdf);
router.post('/:id/corriger', factureController.corriger);
router.post('/:id/annuler', factureController.annuler);

module.exports = router;
