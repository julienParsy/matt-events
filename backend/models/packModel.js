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

// Récupère un pack par ID
async function getPackById(id) {
    const packRes = await db.query('SELECT * FROM packs WHERE id = $1', [id]);
    return packRes.rows[0];
}

// Crée un pack
async function createPack({ nom, description, prix, image_url, stock, sous_categorie_id }) {
    const insertPack = await db.query(
        `INSERT INTO packs (nom, description, prix, image_url, stock, sous_categorie_id)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [nom, description, prix, image_url, stock, sous_categorie_id]
    );
    return insertPack.rows[0];
}

// Met à jour un pack
async function updatePack(id, { nom, description, prix, image_url, stock, sous_categorie_id }) {
    await db.query(
        `UPDATE packs
         SET nom=$1, description=$2, prix=$3, image_url=$4, stock=$5, sous_categorie_id=$6, updated_at=now()
         WHERE id=$7`,
        [nom, description, prix, image_url, stock, sous_categorie_id, id]
    );
}

// Supprime les produits liés à un pack
async function deletePackProducts(packId) {
    await db.query('DELETE FROM pack_products WHERE pack_id=$1', [packId]);
}

// Supprime un pack
async function deletePack(id) {
    await db.query('DELETE FROM packs WHERE id=$1', [id]);
}

// Ajoute un produit à un pack
async function insertPackProduct(packId, produit_id, quantite) {
    await db.query(
        `INSERT INTO pack_products (pack_id, produit_id, quantite)
         VALUES ($1,$2,$3)`,
        [packId, produit_id, quantite]
    );
}

module.exports = {
    getAllPacks,
    getPackProducts,
    getPackById,
    createPack,
    updatePack,
    deletePackProducts,
    deletePack,
    insertPackProduct
};
