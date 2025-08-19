const categoryService = require('../services/categoryService');

async function getCategories(req, res, next) {
    try {
        const categories = await categoryService.fetchAllCategories();
        res.json(categories);
    } catch (err) {
        next(err);
    }
}

async function addCategory(req, res, next) {
    try {
        const { nom } = req.body;
        if (!nom) {
            return res.status(400).json({ message: 'Le nom est requis' });
        }
        const newCategory = await categoryService.createCategory(nom);
        res.status(201).json(newCategory);
    } catch (err) {
        next(err);
    }
}

async function deleteCategory(req, res, next) {
    try {
        const { id } = req.params;
        await categoryService.removeCategory(id);
        res.json({ message: 'Catégorie supprimée' });
    } catch (err) {
        next(err);
    }
}

async function updateCategory(req, res, next) {
    try {
        const { id } = req.params;
        const { nom } = req.body;
        if (!nom) {
            return res.status(400).json({ message: 'Le nom est requis' });
        }
        const updated = await categoryService.updateCategory(id, nom);
        res.json(updated);
    } catch (err) {
        next(err);
    }
}

module.exports = { getCategories, addCategory, deleteCategory, updateCategory };
