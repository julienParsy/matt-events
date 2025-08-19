const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const verifyCaptcha = require('../middleware/verifyCaptcha');
const { isAdmin, verifyToken } = require('../middleware/authMiddleware'); // ← à adapter selon ton projet

const pdfController = require('../controllers/pdfController');

// Limiteur anti-spam pour les clients
const demandeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    message: { message: "Trop de demandes. Veuillez réessayer dans quelques instants." },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- ROUTES CLIENT ---
router.post('/', demandeLimiter, verifyCaptcha, pdfController.createDemande);
router.get('/:id/pdf', verifyToken, isAdmin, pdfController.generateDemande);
router.post('/:id/devis', verifyToken, isAdmin, pdfController.generateDevis);
router.post('/:id/facture', verifyToken, isAdmin, pdfController.generateFacture);
router.get('/', verifyToken, isAdmin, pdfController.getAllDemandes);
router.get('/:id', verifyToken, isAdmin, pdfController.getDemandeById);
router.put('/:id', verifyToken, isAdmin, pdfController.updateDemandeStatut);
router.put('/:id/frais', verifyToken, isAdmin, pdfController.updateFrais);
router.delete('/:id', verifyToken, isAdmin, pdfController.deleteDemande);



module.exports = router;
