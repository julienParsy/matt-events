const productModel = require('../models/productModel');
const db = require('../config/db');

async function getAllProducts() {
  return productModel.getAll();
}

async function addProduct(data) {
  return productModel.create(data);
}

async function updateProduct(id, data) {
  return productModel.update(id, data);
}

async function deleteProduct(id) {
  return productModel.remove(id);
}

// Tu gardes ta logique groupée :
async function getGroupedProducts() {
  const result = await db.query(`
      SELECT 
        p.*, 
        c.id AS category_id, 
        c.nom AS category_name
      FROM produits p
      JOIN categories c ON p.category_id = c.id
    `);

  const grouped = {};
  result.rows.forEach(row => {
    const catId = row.category_id;
    if (!grouped[catId]) {
      grouped[catId] = {
        id: catId,
        nom: row.category_name,
        produits: []
      };
    }
    grouped[catId].produits.push({
      id: row.id,
      nom: row.nom,
      modele: row.modele,
      prix: row.prix,
      stock: row.stock,
      image: row.image,
      description: row.description,
      video_url: row.video_url,
      category_id: row.category_id,
    });
  });
  return Object.values(grouped);
}

module.exports = {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getGroupedProducts,
};
