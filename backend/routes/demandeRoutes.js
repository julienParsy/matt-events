// @feature demandes — Routes /api/demande
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const verifyCaptcha = require('../middleware/verifyCaptcha');
const { isAdmin, verifyToken } = require('../middleware/authMiddleware'); 

const demandeController = require('../controllers/demandeController');

// Limiteur anti-spam pour les clients
const demandeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    message: { message: "Trop de demandes. Veuillez réessayer dans quelques instants." },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- Public : envoi depuis le panier ---
router.post('/', demandeLimiter, verifyCaptcha, demandeController.createDemande);
// --- Admin ---
router.get('/:id/pdf', verifyToken, isAdmin, demandeController.generateDemande);
router.post('/:id/devis', verifyToken, isAdmin, demandeController.generateDevis);
router.post('/:id/facture', verifyToken, isAdmin, demandeController.generateFacture);
router.get('/', verifyToken, isAdmin, demandeController.getAllDemandes);
router.get('/:id', verifyToken, isAdmin, demandeController.getDemandeById);
router.put('/:id', verifyToken, isAdmin, demandeController.updateDemandeStatut);
router.put('/:id/frais', verifyToken, isAdmin, demandeController.updateFrais);
router.delete('/:id', verifyToken, isAdmin, demandeController.deleteDemande);
router.post('/:id/bonCommande', verifyToken, isAdmin, demandeController.generateBonCommande);



module.exports = router;
