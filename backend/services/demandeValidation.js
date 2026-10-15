// backend/services/demandeValidation.js
// Contrôles serveur d'une demande envoyée depuis le panier (mêmes règles que le formulaire du site),
// et reconstruction des articles à partir du catalogue : on ne fait jamais confiance aux prix envoyés par le navigateur.
const db = require('../config/db');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9\s+().-]{8,30}$/;
const DELIVERY_TYPES = ['pickup', 'delivery', 'setup'];
const MAX_QTY = 999;

const badRequest = message => Object.assign(new Error(message), { status: 400 });
const text = (v, max) => (v == null ? '' : String(v).trim().slice(0, max));

/** Date du jour en France, au format AAAA-MM-JJ (le serveur tourne en UTC) */
function todayInFrance() {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
}

/** Vérifie et nettoie les informations du client ; lève une erreur 400 lisible sinon */
function validateClient(input) {
    if (!input || typeof input !== 'object') throw badRequest('Informations client manquantes.');
    const client = {
        nom: text(input.nom, 100),
        prenom: text(input.prenom, 100),
        email: text(input.email, 254),
        telephone: text(input.telephone, 30),
        eventDate: text(input.eventDate, 10),
        deliveryType: text(input.deliveryType, 20),
        adresse: text(input.adresse, 300),
    };
    if (!client.nom) throw badRequest('Le nom est requis.');
    if (!client.prenom) throw badRequest('Le prénom est requis.');
    if (!EMAIL_RE.test(client.email)) throw badRequest('Adresse e-mail invalide.');
    if (!PHONE_RE.test(client.telephone)) throw badRequest('Numéro de téléphone invalide.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(client.eventDate) || Number.isNaN(new Date(client.eventDate).getTime())) {
        throw badRequest("La date de l'événement est invalide.");
    }
    if (client.eventDate < todayInFrance()) throw badRequest("La date de l'événement ne peut pas être passée.");
    if (!DELIVERY_TYPES.includes(client.deliveryType)) throw badRequest('Mode de retrait ou de livraison invalide.');
    if (client.deliveryType !== 'pickup' && !client.adresse) throw badRequest("L'adresse est requise pour une livraison.");
    return client;
}

/**
 * Reconstruit les articles du panier depuis la base (nom, modèle, prix, contenu des packs).
 * Le navigateur ne fournit que l'identifiant, le type et la quantité de chaque article.
 */
async function buildProduitsFromCatalog(items) {
    if (!Array.isArray(items) || items.length === 0) throw badRequest('Votre panier est vide.');
    if (items.length > 100) throw badRequest('Trop d’articles dans le panier.');

    const wanted = items.map(item => ({
        id: Number(item?.id),
        type: item?.type === 'pack' ? 'pack' : 'produit',
        quantite: Math.round(Number(item?.quantite)),
    }));
    if (wanted.some(w => !Number.isInteger(w.id) || w.id <= 0)) throw badRequest('Un article du panier est invalide.');
    if (wanted.some(w => !Number.isInteger(w.quantite) || w.quantite < 1 || w.quantite > MAX_QTY)) {
        throw badRequest('Une quantité du panier est invalide.');
    }

    const productIds = wanted.filter(w => w.type === 'produit').map(w => w.id);
    const packIds = wanted.filter(w => w.type === 'pack').map(w => w.id);

    const [products, packs, packItems] = await Promise.all([
        productIds.length
            ? db.query('SELECT id, nom, modele, prix, stock FROM produits WHERE id = ANY($1)', [productIds])
            : { rows: [] },
        packIds.length
            ? db.query('SELECT id, nom, prix, stock FROM packs WHERE id = ANY($1)', [packIds])
            : { rows: [] },
        packIds.length
            ? db.query(
                `SELECT pp.pack_id, pp.quantite, pr.nom, pr.modele
                 FROM pack_products pp JOIN produits pr ON pr.id = pp.produit_id
                 WHERE pp.pack_id = ANY($1) ORDER BY pp.pack_id, pr.nom`, [packIds])
            : { rows: [] },
    ]);
    const productById = new Map(products.rows.map(p => [p.id, p]));
    const packById = new Map(packs.rows.map(p => [p.id, p]));

    return wanted.map(w => {
        const source = w.type === 'pack' ? packById.get(w.id) : productById.get(w.id);
        if (!source) {
            throw badRequest("Un article de votre panier n'est plus disponible. Retirez-le du panier puis réessayez.");
        }
        const stock = Number(source.stock);
        if (Number.isFinite(stock) && w.quantite > stock) {
            throw badRequest(`Quantité demandée trop élevée pour « ${source.nom} » (${stock} disponible${stock > 1 ? 's' : ''}).`);
        }
        const item = {
            id: source.id,
            type: w.type,
            nom: source.nom,
            modele: w.type === 'pack' ? '' : (source.modele || ''),
            prix: Number(source.prix),
            quantite: w.quantite,
        };
        if (w.type === 'pack') {
            item.produits = packItems.rows
                .filter(r => r.pack_id === source.id)
                .map(r => ({ nom: r.nom, modele: r.modele, quantite: r.quantite }));
        }
        return item;
    });
}

module.exports = { validateClient, buildProduitsFromCatalog, todayInFrance };
