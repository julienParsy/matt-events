// @feature factures
// Factures et avoirs : numérotation légale continue, contenu figé, correction par avoir.
//
// Règles :
// - Factures F-AAAA-NNNN et avoirs AV-AAAA-NNNN : deux séries continues, sans trou.
// - Le contenu (client, lignes, frais) est enregistré à l'émission : le PDF se retélécharge toujours à l'identique.
// - Une facture émise n'est jamais modifiée. Pour la corriger : un avoir l'annule et une nouvelle facture la remplace.
// - Les numéros ne sont jamais libérés : si la demande est supprimée, la facture reste (demande_id passe à NULL).
const pool = require('../config/db');
const { computeTotals, toNumber } = require('../pdf/pdfHelpers');

// Évolution de la table, rejouable sans risque (chaque instruction ne fait rien si c'est déjà fait)
const SCHEMA = [
    `CREATE TABLE IF NOT EXISTS factures (
        id          SERIAL PRIMARY KEY,
        numero      TEXT        NOT NULL UNIQUE,
        annee       INTEGER     NOT NULL,
        sequence    INTEGER     NOT NULL,
        demande_id  INTEGER     REFERENCES demandes(id) ON DELETE SET NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `ALTER TABLE factures ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'facture'`,   // 'facture' | 'avoir'
    `ALTER TABLE factures ADD COLUMN IF NOT EXISTS statut TEXT NOT NULL DEFAULT 'emise'`,   // 'emise' | 'annulee'
    `ALTER TABLE factures ADD COLUMN IF NOT EXISTS contenu JSONB`,
    `ALTER TABLE factures ADD COLUMN IF NOT EXISTS total NUMERIC(12,2)`,
    // Avoir : facture qu'il annule. Facture corrigée : facture qu'elle remplace.
    `ALTER TABLE factures ADD COLUMN IF NOT EXISTS origine_id INTEGER REFERENCES factures(id)`,
    // Une demande peut maintenant avoir plusieurs factures (après correction) et les avoirs ont leur propre série
    `ALTER TABLE factures DROP CONSTRAINT IF EXISTS factures_demande_id_key`,
    `ALTER TABLE factures DROP CONSTRAINT IF EXISTS factures_annee_sequence_key`,
    `CREATE UNIQUE INDEX IF NOT EXISTS factures_type_annee_sequence_idx ON factures (type, annee, sequence)`,
];

let schemaReady = null;
async function ensureSchema(db = pool) {
    const run = async conn => { for (const sql of SCHEMA) await conn.query(sql); };
    if (db !== pool) return run(db); // transaction de test : pas de mémorisation
    if (!schemaReady) schemaReady = run(pool).catch(err => { schemaReady = null; throw err; });
    return schemaReady;
}

const PREFIX = { facture: 'F', avoir: 'AV' };
const formatNumero = (type, annee, sequence) => `${PREFIX[type]}-${annee}-${String(sequence).padStart(4, '0')}`;

/** Exécute fn(client) dans une transaction (ou dans celle fournie) */
async function withTransaction(fn, client = null) {
    if (client) return fn(client);
    await ensureSchema();
    const db = await pool.connect();
    try {
        await db.query('BEGIN');
        const result = await fn(db);
        await db.query('COMMIT');
        return result;
    } catch (err) {
        await db.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        db.release();
    }
}

// ---------------------------------------------------------------------------
// Contenu figé d'une facture
// ---------------------------------------------------------------------------

/** Date de l'événement en "AAAA-MM-JJ" (sans décalage de fuseau) */
function toIsoDate(value) {
    if (!value) return null;
    if (value instanceof Date) {
        const p = n => String(n).padStart(2, '0');
        return `${value.getFullYear()}-${p(value.getMonth() + 1)}-${p(value.getDate())}`;
    }
    const m = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
}

const cleanText = (v, max = 300) => (v == null ? '' : String(v).trim().slice(0, max));

/** Nettoie et vérifie un contenu (saisi dans l'admin ou construit depuis une demande) */
function normalizeContenu(input = {}) {
    const client = input.client || {};
    const produits = (Array.isArray(input.produits) ? input.produits : []).map(p => {
        const item = {
            nom: cleanText(p.nom, 200),
            modele: cleanText(p.modele, 200),
            prix: Math.round(toNumber(p.prix) * 100) / 100,
            quantite: Math.max(1, Math.round(toNumber(p.quantite) || 1)),
            type: p.type === 'pack' ? 'pack' : 'produit',
        };
        // Détail d'un pack : conservé tel quel (affichage uniquement)
        if (item.type === 'pack' && Array.isArray(p.produits)) {
            item.produits = p.produits.map(sp => ({
                nom: cleanText(sp.nom, 200), modele: cleanText(sp.modele, 200), quantite: Math.max(1, toNumber(sp.quantite) || 1),
            }));
        }
        return item;
    });

    const errors = [];
    if (!produits.length) errors.push('La facture doit contenir au moins une ligne.');
    produits.forEach((p, i) => {
        if (!p.nom) errors.push(`Ligne ${i + 1} : la désignation est obligatoire.`);
        if (p.prix < 0) errors.push(`Ligne ${i + 1} : le prix ne peut pas être négatif.`);
    });
    const frais = {
        montage: Math.max(0, toNumber(input.frais?.montage)),
        livraison: Math.max(0, toNumber(input.frais?.livraison)),
        caution: Math.max(0, toNumber(input.frais?.caution)),
    };
    const contenu = {
        client: {
            prenom: cleanText(client.prenom, 100),
            nom: cleanText(client.nom, 100),
            email: cleanText(client.email, 200),
            telephone: cleanText(client.telephone, 50),
            adresse: cleanText(client.adresse, 300),
        },
        eventDate: toIsoDate(input.eventDate),
        deliveryType: ['setup', 'delivery', 'pickup'].includes(input.deliveryType) ? input.deliveryType : 'pickup',
        produits,
        frais,
        demandeNumero: input.demandeNumero ? String(input.demandeNumero) : null,
    };
    if (!contenu.client.nom && !contenu.client.prenom) errors.push('Le nom du client est obligatoire.');
    if (errors.length) throw Object.assign(new Error(errors.join(' ')), { status: 400 });
    return contenu;
}

/** Contenu construit depuis une demande et les frais saisis dans l'admin */
function contenuFromDemande(d, data = {}) {
    return normalizeContenu({
        client: { prenom: d.prenom, nom: d.nom, email: d.email, telephone: d.telephone, adresse: data.adresse || d.adresse },
        eventDate: d.event_date,
        deliveryType: d.deliverytype,
        produits: d.produits,
        frais: { montage: data.montage, livraison: data.livraison, caution: data.caution },
        demandeNumero: d.id,
    });
}

const totalOf = contenu => computeTotals(contenu.produits, contenu.frais).total;

// ---------------------------------------------------------------------------
// Création des documents
// ---------------------------------------------------------------------------

async function createDocument(db, { type, demandeId = null, contenu, origineId = null }) {
    // Verrou : deux documents créés au même instant ne peuvent pas obtenir le même numéro
    await db.query('LOCK TABLE factures IN SHARE ROW EXCLUSIVE MODE');
    const annee = new Date().getFullYear();
    const { rows } = await db.query(
        'SELECT COALESCE(MAX(sequence), 0) + 1 AS next FROM factures WHERE type = $1 AND annee = $2', [type, annee]
    );
    const sequence = rows[0].next;
    const total = type === 'avoir' ? -totalOf(contenu) : totalOf(contenu);
    const inserted = await db.query(
        `INSERT INTO factures (numero, annee, sequence, type, statut, demande_id, contenu, total, origine_id)
         VALUES ($1, $2, $3, $4, 'emise', $5, $6, $7, $8) RETURNING *`,
        [formatNumero(type, annee, sequence), annee, sequence, type, demandeId, JSON.stringify(contenu), total, origineId]
    );
    return inserted.rows[0];
}

/** Ligne complète + numéro du document d'origine */
async function getById(db, id) {
    const { rows } = await db.query(
        `SELECT f.*, o.numero AS origine_numero, o.created_at AS origine_date
         FROM factures f LEFT JOIN factures o ON o.id = f.origine_id WHERE f.id = $1`, [id]
    );
    return rows[0] || null;
}

/**
 * Factures émises avant l'enregistrement du contenu : on le reconstitue une fois depuis la demande.
 * Sans demande (supprimée), impossible : on le signale.
 */
async function ensureContenu(db, row) {
    if (row.contenu) return row;
    if (!row.demande_id) {
        throw Object.assign(new Error(`Le contenu de la facture ${row.numero} n'a pas été enregistré et sa demande n'existe plus.`), { status: 409 });
    }
    const d = (await db.query('SELECT * FROM demandes WHERE id = $1', [row.demande_id])).rows[0];
    if (!d) throw Object.assign(new Error(`La demande de la facture ${row.numero} est introuvable.`), { status: 409 });
    const contenu = contenuFromDemande(d, { montage: d.montage, livraison: d.livraison, caution: d.caution });
    const updated = await db.query(
        'UPDATE factures SET contenu = $1, total = $2 WHERE id = $3 AND contenu IS NULL RETURNING *',
        [JSON.stringify(contenu), totalOf(contenu), row.id]
    );
    return { ...row, ...(updated.rows[0] || {}) };
}

/**
 * Facture d'une demande (depuis la fenêtre « Générer un document ») :
 * renvoie la facture en cours si elle existe (contenu figé), sinon l'émet avec les frais saisis.
 */
async function emettrePourDemande(demandeId, data = {}, client = null) {
    return withTransaction(async db => {
        const existing = (await db.query(
            `SELECT id FROM factures WHERE demande_id = $1 AND type = 'facture' AND statut = 'emise'
             ORDER BY id DESC LIMIT 1`, [demandeId]
        )).rows[0];
        if (existing) {
            const row = await ensureContenu(db, await getById(db, existing.id));
            return { row: await getById(db, row.id), existing: true };
        }
        const d = (await db.query('SELECT * FROM demandes WHERE id = $1', [demandeId])).rows[0];
        if (!d) throw Object.assign(new Error('Demande non trouvée'), { status: 404 });
        const created = await createDocument(db, { type: 'facture', demandeId, contenu: contenuFromDemande(d, data) });
        return { row: await getById(db, created.id), existing: false };
    }, client);
}

/** Contenu proposé pour une facture de demande, sans rien enregistrer (aperçu) */
async function apercuPourDemande(demandeId, data = {}) {
    const d = (await pool.query('SELECT * FROM demandes WHERE id = $1', [demandeId])).rows[0];
    if (!d) throw Object.assign(new Error('Demande non trouvée'), { status: 404 });
    return contenuFromDemande(d, data);
}

async function list(client = null) {
    const db = client || pool;
    if (!client) await ensureSchema();
    const { rows } = await db.query(
        `SELECT f.id, f.numero, f.type, f.statut, f.created_at, f.total, f.demande_id, f.contenu,
                o.numero AS origine_numero,
                (SELECT r.numero FROM factures r WHERE r.origine_id = f.id AND r.type = 'avoir' LIMIT 1) AS avoir_numero,
                (SELECT r.numero FROM factures r WHERE r.origine_id = f.id AND r.type = 'facture' LIMIT 1) AS remplacee_par,
                d.prenom AS d_prenom, d.nom AS d_nom
         FROM factures f
         LEFT JOIN factures o ON o.id = f.origine_id
         LEFT JOIN demandes d ON d.id = f.demande_id
         ORDER BY f.created_at DESC, f.id DESC`
    );
    return rows.map(r => ({
        id: r.id,
        numero: r.numero,
        type: r.type,
        statut: r.statut,
        date: r.created_at,
        total: r.total !== null ? Number(r.total) : null,
        demandeId: r.demande_id,
        client: r.contenu
            ? [r.contenu.client?.prenom, r.contenu.client?.nom].filter(Boolean).join(' ')
            : [r.d_prenom, r.d_nom].filter(Boolean).join(' '),
        origineNumero: r.origine_numero,
        avoirNumero: r.avoir_numero,
        remplaceePar: r.remplacee_par,
        modifiable: r.type === 'facture' && r.statut === 'emise',
    }));
}

/** Document complet (avec contenu, reconstitué si besoin) */
async function get(id, client = null) {
    return withTransaction(async db => {
        const row = await getById(db, id);
        if (!row) throw Object.assign(new Error('Document introuvable'), { status: 404 });
        return ensureContenu(db, row).then(r => getById(db, r.id));
    }, client);
}

async function lockFactureEmise(db, id) {
    const row = (await db.query('SELECT * FROM factures WHERE id = $1 FOR UPDATE', [id])).rows[0];
    if (!row) throw Object.assign(new Error('Facture introuvable'), { status: 404 });
    if (row.type !== 'facture') throw Object.assign(new Error('Seule une facture peut être corrigée ou annulée.'), { status: 400 });
    if (row.statut !== 'emise') throw Object.assign(new Error(`La facture ${row.numero} est déjà annulée.`), { status: 409 });
    return ensureContenu(db, row);
}

/** Annule une facture par un avoir (sans nouvelle facture) */
async function annuler(id, client = null) {
    return withTransaction(async db => {
        const facture = await lockFactureEmise(db, id);
        const avoir = await createDocument(db, {
            type: 'avoir', demandeId: facture.demande_id, contenu: facture.contenu, origineId: facture.id,
        });
        await db.query("UPDATE factures SET statut = 'annulee' WHERE id = $1", [facture.id]);
        return { avoir: await getById(db, avoir.id) };
    }, client);
}

/** Corrige une facture : avoir d'annulation + nouvelle facture avec le contenu corrigé */
async function corriger(id, input, client = null) {
    const contenu = normalizeContenu(input);
    return withTransaction(async db => {
        const facture = await lockFactureEmise(db, id);
        contenu.demandeNumero = contenu.demandeNumero || facture.contenu?.demandeNumero || (facture.demande_id ? String(facture.demande_id) : null);
        const avoir = await createDocument(db, {
            type: 'avoir', demandeId: facture.demande_id, contenu: facture.contenu, origineId: facture.id,
        });
        await db.query("UPDATE factures SET statut = 'annulee' WHERE id = $1", [facture.id]);
        const nouvelle = await createDocument(db, {
            type: 'facture', demandeId: facture.demande_id, contenu, origineId: facture.id,
        });
        return { avoir: await getById(db, avoir.id), facture: await getById(db, nouvelle.id) };
    }, client);
}

module.exports = {
    ensureSchema,
    formatNumero,
    normalizeContenu,
    contenuFromDemande,
    emettrePourDemande,
    apercuPourDemande,
    list,
    get,
    annuler,
    corriger,
};
