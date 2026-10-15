// @feature pdf
// Mise en forme (montants, dates) et calculs communs aux documents PDF.
const { ARRHES_RATE } = require('./pdfConstants');

function toNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function getQty(p) {
    return toNumber(p?.quantite ?? p?.quantity ?? 1) || 1;
}

function getUnitPrice(p) {
    return toNumber(p?.prix ?? p?.price ?? 0);
}

// Les polices standard des PDF (WinAnsi) ne connaissent pas l'espace fine insécable (U+202F)
// produite par Intl en français : on la remplace par une espace insécable classique.
const cleanSpaces = s => s.replace(/ /g, ' ');

/** 1234.5 → "1 234,50 €" */
function formatMoney(value) {
    return cleanSpaces(toNumber(value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }));
}

/** Accepte un objet Date, "2026-11-21" ou un horodatage ; renvoie une Date valide ou null. */
function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const s = String(value);
    // "AAAA-MM-JJ" seul : date locale (évite le décalage d'un jour lié au fuseau UTC)
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}

/** "samedi 21 novembre 2026" */
function formatLongDate(value) {
    const d = toDate(value);
    return d ? cleanSpaces(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) : null;
}

/** "21/11/2026" */
function formatShortDate(value) {
    const d = toDate(value);
    return d ? d.toLocaleDateString('fr-FR') : null;
}

function addDays(value, days) {
    const d = toDate(value);
    if (!d) return null;
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
}

/** Montants du document : matériel, frais, total, arrhes et solde (arrondis au centime) */
function computeTotals(produits, frais = {}) {
    const list = Array.isArray(produits) ? produits : [];
    const materiel = list.reduce((sum, p) => sum + getUnitPrice(p) * getQty(p), 0);
    const montage = toNumber(frais.montage);
    const livraison = toNumber(frais.livraison);
    const total = Math.round((materiel + montage + livraison) * 100) / 100;
    const arrhes = Math.round(total * ARRHES_RATE * 100) / 100;
    return {
        materiel,
        montage,
        livraison,
        total,
        arrhes,
        solde: Math.round((total - arrhes) * 100) / 100,
        caution: toNumber(frais.caution),
    };
}

/** Sous-total des produits (conservé pour compatibilité) */
function formatTotal(produits) {
    return computeTotals(produits).materiel;
}

const DELIVERY_LABELS = {
    setup: 'Livraison avec installation (montage et démontage)',
    delivery: 'Livraison simple, sans installation',
    pickup: 'Retrait sur place à Erre, sur rendez-vous',
};

function deliveryLabel(type) {
    return DELIVERY_LABELS[type] || DELIVERY_LABELS.pickup;
}

module.exports = {
    toNumber,
    getQty,
    getUnitPrice,
    formatMoney,
    toDate,
    formatLongDate,
    formatShortDate,
    addDays,
    computeTotals,
    formatTotal,
    deliveryLabel,
};
