// backend/services/factureService.js
// Numérotation légale des factures : série continue et chronologique, sans trou (F-2026-0001, F-2026-0002…).
// Le numéro est attribué à la première facture d'une demande, puis réutilisé (même numéro, même date) si on la regénère.
// Il n'est jamais libéré : même si la demande est supprimée, la ligne reste (demande_id passe à NULL).
const pool = require('../config/db');

const CREATE_TABLE = `
    CREATE TABLE IF NOT EXISTS factures (
        id          SERIAL PRIMARY KEY,
        numero      TEXT        NOT NULL UNIQUE,
        annee       INTEGER     NOT NULL,
        sequence    INTEGER     NOT NULL,
        demande_id  INTEGER     UNIQUE REFERENCES demandes(id) ON DELETE SET NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (annee, sequence)
    )`;

// Création de la table au premier besoin (une seule fois par démarrage du serveur)
let tableReady = null;
function ensureTable(db = pool) {
    if (db !== pool) return db.query(CREATE_TABLE); // transaction de test : pas de mémorisation
    if (!tableReady) tableReady = pool.query(CREATE_TABLE).catch(err => { tableReady = null; throw err; });
    return tableReady;
}

const formatNumero = (annee, sequence) => `F-${annee}-${String(sequence).padStart(4, '0')}`;

/**
 * Renvoie { numero, date } de la facture de la demande, en créant le numéro si besoin.
 * client : connexion à utiliser (facultatif) ; sinon une connexion du pool, dans sa propre transaction.
 */
async function getOrCreateFacture(demandeId, client = null) {
    const ownConnection = !client;
    const db = client || await pool.connect();
    try {
        await ensureTable(ownConnection ? pool : db);
        if (ownConnection) await db.query('BEGIN');

        const existing = await db.query('SELECT numero, created_at FROM factures WHERE demande_id = $1', [demandeId]);
        if (existing.rows[0]) {
            if (ownConnection) await db.query('COMMIT');
            return { numero: existing.rows[0].numero, date: existing.rows[0].created_at };
        }

        // Verrou : deux factures générées au même instant ne peuvent pas obtenir le même numéro
        await db.query('LOCK TABLE factures IN SHARE ROW EXCLUSIVE MODE');
        const again = await db.query('SELECT numero, created_at FROM factures WHERE demande_id = $1', [demandeId]);
        if (again.rows[0]) {
            if (ownConnection) await db.query('COMMIT');
            return { numero: again.rows[0].numero, date: again.rows[0].created_at };
        }

        const annee = new Date().getFullYear();
        const { rows } = await db.query('SELECT COALESCE(MAX(sequence), 0) + 1 AS next FROM factures WHERE annee = $1', [annee]);
        const sequence = rows[0].next;
        const inserted = await db.query(
            'INSERT INTO factures (numero, annee, sequence, demande_id) VALUES ($1, $2, $3, $4) RETURNING numero, created_at',
            [formatNumero(annee, sequence), annee, sequence, demandeId]
        );
        if (ownConnection) await db.query('COMMIT');
        return { numero: inserted.rows[0].numero, date: inserted.rows[0].created_at };
    } catch (err) {
        if (ownConnection) await db.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        if (ownConnection) db.release();
    }
}

module.exports = { getOrCreateFacture, formatNumero, ensureTable };
