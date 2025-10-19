// src/controllers/sousCategorieController.js
const sousCategorieService = require('../services/sousCategorieService');

async function getAllSousCategories(req, res) {
    try {
        const sousCategories = await sousCategorieService.getAllSousCategories();
        res.json(sousCategories);
    } catch (err) {
        console.error('Erreur get sous-catégories :', err);
        res.status(500).json({ message: err.message });
    }
}

async function createSousCategorie(req, res) {
    try {
        const { nom } = req.body;
        if (!nom) return res.status(400).json({ message: 'Nom requis' });

        const newSousCat = await sousCategorieService.createSousCategorie(nom);
        res.status(201).json(newSousCat);
    } catch (err) {
        console.error('Erreur création sous-catégorie :', err);
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    getAllSousCategories,
    createSousCategorie
};
