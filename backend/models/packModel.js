const db = require('../config/db');

// Récupère tous les packs
async function getAllPacks() {
    const packsRes = await db.query('SELECT * FROM packs ORDER BY id');
    return packsRes.rows;
}

// Récupère les produits d’un pack
async function getPackProducts(packId) {
    const itemsRes = await db.query(
        `SELECT pp.produit_id, pp.quantite, pr.*
         FROM pack_products pp
         JOIN produits pr ON pp.produit_id = pr.id
         WHERE pp.pack_id = $1`,
        [packId]
    );
    return itemsRes.rows;
}

async function getPackById(id) {
    const packRes = await db.query('SELECT * FROM packs WHERE id = $1', [id]);
    return packRes.rows[0];
}

async function createPack({ nom, description, prix, image_url, stock }) {
    const insertPack = await db.query(
        `INSERT INTO packs (nom, description, prix, image_url, stock)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [nom, description, prix, image_url, stock]
    );
    return insertPack.rows[0];
}

async function insertPackProduct(packId, produit_id, quantite) {
    await db.query(
        `INSERT INTO pack_products (pack_id, produit_id, quantite)
         VALUES ($1,$2,$3)`,
        [packId, produit_id, quantite]
    );
}

async function updatePack(id, { nom, description, prix, image_url, stock }) {
    await db.query(
        `UPDATE packs
         SET nom=$1, description=$2, prix=$3, image_url=$4, stock=$5, updated_at=now()
         WHERE id=$6`,
        [nom, description, prix, image_url, stock, id]
    );
}

async function deletePackProducts(packId) {
    await db.query('DELETE FROM pack_products WHERE pack_id=$1', [packId]);
}

async function deletePack(id) {
    await db.query('DELETE FROM packs WHERE id=$1', [id]);
}

module.exports = {
    getAllPacks,
    getPackProducts,
    getPackById,
    createPack,
    insertPackProduct,
    updatePack,
    deletePackProducts,
    deletePack
};
