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

module.exports = { getAllSousCategories, createSousCategorie };
