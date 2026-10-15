// @feature categories — Sous-catégories des packs (/api/sous-categories)
const sousCategorieService = require('../services/sousCategorieService');

const cleanNom = nom => (nom == null ? '' : String(nom).trim().slice(0, 100));

async function getAllSousCategories(req, res, next) {
    try {
        res.json(await sousCategorieService.getAllSousCategories());
    } catch (err) { next(err); }
}

async function createSousCategorie(req, res, next) {
    try {
        const nom = cleanNom(req.body?.nom);
        if (!nom) return res.status(400).json({ message: 'Nom requis' });
        res.status(201).json(await sousCategorieService.createSousCategorie(nom));
    } catch (err) { next(err); }
}

async function updateSousCategorie(req, res, next) {
    try {
        const nom = cleanNom(req.body?.nom);
        if (!nom) return res.status(400).json({ message: 'Nom requis' });
        const updated = await sousCategorieService.updateSousCategorie(req.params.id, nom);
        if (!updated) return res.status(404).json({ message: 'Sous-catégorie introuvable' });
        res.json(updated);
    } catch (err) { next(err); }
}

async function deleteSousCategorie(req, res, next) {
    try {
        const deleted = await sousCategorieService.deleteSousCategorie(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Sous-catégorie introuvable' });
        res.json({ message: 'Sous-catégorie supprimée' });
    } catch (err) {
        // Encore utilisée par des packs (clé étrangère)
        if (err.code === '23503') {
            return res.status(409).json({ message: 'Cette sous-catégorie est encore utilisée par des packs : changez-les de sous-catégorie avant de la supprimer.' });
        }
        next(err);
    }
}

module.exports = {
    getAllSousCategories,
    createSousCategorie,
    updateSousCategorie,
    deleteSousCategorie,
};
