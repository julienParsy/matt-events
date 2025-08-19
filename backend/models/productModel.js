const db = require('../config/db');

async function getAll() {
    const result = await db.query(`
        SELECT p.id, p.nom, p.modele, p.prix, p.stock, p.image, p.description, p.video_url,
               c.nom AS categorie
        FROM produits p
        JOIN categories c ON p.category_id = c.id
        ORDER BY c.nom, p.nom
    `);
    return result.rows;
}

async function create({ nom, modele, prix, stock = 0, category_id, image, description, video_url }) {
    const result = await db.query(
        `INSERT INTO produits (nom, modele, prix, stock, category_id, image, description, video_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [nom, modele, prix, stock, category_id, image || null, description || null, video_url || null]
    );
    return result.rows[0];
}

async function update(id, { nom, modele, prix, stock = 0, category_id, image, description, video_url }) {
    const result = await db.query(
        `UPDATE produits SET nom = $1, modele = $2, prix = $3, stock = $4,
            category_id = $5, image = $6, description = $7, video_url = $8
         WHERE id = $9 RETURNING *`,
        [nom, modele, prix, stock, category_id, image || null, description || null, video_url || null, id]
    );
    return result.rows[0];
}

async function remove(id) {
    const result = await db.query(
        `DELETE FROM produits WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
}

module.exports = { getAll, create, update, remove };
