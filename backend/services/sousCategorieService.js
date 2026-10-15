const pool = require('../config/db');

// Récupère toutes les sous-catégories (autonomes)
async function getAllSousCategories() {
    const { rows } = await pool.query(`
        SELECT id, nom
        FROM sous_categories
        ORDER BY nom;
    `);
    return rows;
}

// Crée une nouvelle sous-catégorie
async function createSousCategorie(nom) {
    const { rows } = await pool.query(
        'INSERT INTO sous_categories (nom) VALUES ($1) RETURNING *',
        [nom]
    );
    return rows[0];
}

async function updateSousCategorie(id, nom) {
    const { rows } = await pool.query('UPDATE sous_categories SET nom = $1 WHERE id = $2 RETURNING *', [nom, id]);
    return rows[0];
}

async function deleteSousCategorie(id) {
    const { rows } = await pool.query('DELETE FROM sous_categories WHERE id = $1 RETURNING id', [id]);
    return rows[0];
}

module.exports = { getAllSousCategories, createSousCategorie, updateSousCategorie, deleteSousCategorie };
