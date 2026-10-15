// @feature panier — Route /api/tarifs
// Grille des frais (installation, livraison, caution), la même que sur le PDF de la demande.
const express = require('express');
const router = express.Router();
const { TARIFS } = require('../pdf/pdfConstants');

// Lecture publique : affichée sur le site avant l'envoi d'une demande
router.get('/', (req, res) => res.json(TARIFS));

module.exports = router;
