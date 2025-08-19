const db = require('../config/db');

// Création d'une demande
async function createDemande(data) {
    const insertQuery = `
        INSERT INTO demandes (produits, email, nom, prenom, telephone, event_date, statut, deliverytype, montage, livraison, caution)
        VALUES ($1, $2, $3, $4, $5, $6, 'en_attente', $7, $8, $9, $10)
        RETURNING *
    `;
    const values = [
        JSON.stringify(data.produits), data.email, data.nom, data.prenom, data.telephone,
        data.eventDate, data.deliveryType, data.montage, data.livraison, data.caution
    ];
    const { rows } = await db.query(insertQuery, values);
    return rows[0];
}

// Récupération
async function getDemandeById(id) {
    const result = await db.query('SELECT * FROM demandes WHERE id = $1', [id]);
    return result.rows[0];
}

async function getAllDemandes() {
    const result = await db.query('SELECT * FROM demandes ORDER BY created_at DESC');
    return result.rows;
}

async function updateDemandeStatut(id, statut) {
    await db.query('UPDATE demandes SET statut = $1 WHERE id = $2', [statut, id]);
}

async function updateFrais(id, montage, livraison, caution) {
    await db.query(`
        UPDATE demandes
        SET montage = $1, livraison = $2, caution = $3
        WHERE id = $4
    `, [montage, livraison, caution, id]);
}

async function deleteDemande(id) {
    await db.query('DELETE FROM demandes WHERE id = $1', [id]);
}

module.exports = {
    createDemande,
    getDemandeById,
    getAllDemandes,
    updateDemandeStatut,
    updateFrais,
    deleteDemande
};
