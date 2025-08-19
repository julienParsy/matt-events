const categoryModel = require('../models/categoryModel');

async function fetchAllCategories() {
    return categoryModel.getAllCategories();
}

async function createCategory(nom) {
    return categoryModel.createCategory(nom);
}

async function updateCategory(id, nom) {
    return await categoryModel.updateCategory(id, nom);
}

async function removeCategory(id) {
    return categoryModel.removeCategory(id);
}


module.exports = {
    fetchAllCategories,
    createCategory,
    updateCategory,
    removeCategory
};
