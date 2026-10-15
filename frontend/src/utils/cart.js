// src/utils/cart.js

/** Identifiant unique d'une ligne du panier (type + id). */
export const getItemKey = (item) => `${item.type ?? 'item'}-${item.id}`;

/** Quantité totale et prix total du panier (une seule source de vérité). */
export const getCartTotals = (cart) =>
    cart.reduce(
        (acc, item) => ({
            count: acc.count + item.quantite,
            price: acc.price + item.prix * item.quantite,
        }),
        { count: 0, price: 0 }
    );

/** Force la quantité entre 1 et le stock disponible. */
export const clampQuantity = (quantity, stock) =>
    Math.min(Math.max(quantity, 1), Number.isFinite(stock) ? stock : Infinity);

const priceFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
export const formatPrice = (value) => priceFormatter.format(value);

/**
 * Date locale au format YYYY-MM-DD (toISOString() renvoie de l'UTC,
 * ce qui décale d'un jour en soirée).
 */
export const toLocalISODate = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/**
 * Produits envoyés au serveur : seulement l'identifiant, le type et la quantité.
 * Le serveur relit nom, prix, stock et contenu des packs dans le catalogue.
 */
export const toPayloadItem = (item) => ({
    id: item.id,
    type: item.type === 'pack' ? 'pack' : 'produit',
    quantite: item.quantite,
});