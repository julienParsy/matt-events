const db = require('../config/db');
const pool = require('../config/db'); 

async function getAllCategories() {
  const result = await db.query('SELECT * FROM categories ORDER BY nom');
  return result.rows;
}

async function createCategory(nom) {
  const result = await db.query(
    'INSERT INTO categories (nom) VALUES ($1) RETURNING *',
    [nom]
  );
  return result.rows[0];
}

async function updateCategory(id, nom) {
  const result = await pool.query(
    'UPDATE categories SET nom = $1 WHERE id = $2 RETURNING *',
    [nom, id]
  );
  return result.rows[0];
}


async function removeCategory(id) {
  await db.query('DELETE FROM categories WHERE id = $1', [id]);
}

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  removeCategory
};
