// @feature catalogue
// Tranches de budget de la boutique (adresse /shop?prix=25-50).
// Bornes : min incluse, max exclue (un article à 50 € est dans « 50 à 100 € »).
// Réparties d'après les prix du catalogue (produits 6–150 €, packs 60–300 €) : à ajuster si les tarifs évoluent.
export const PRICE_RANGES = [
    { key: '0-25', label: 'Moins de 25 €', min: 0, max: 25 },
    { key: '25-50', label: '25 à 50 €', min: 25, max: 50 },
    { key: '50-100', label: '50 à 100 €', min: 50, max: 100 },
    { key: '100-200', label: '100 à 200 €', min: 100, max: 200 },
    { key: '200+', label: '200 € et plus', min: 200, max: Infinity },
];

export const findPriceRange = key => PRICE_RANGES.find(r => r.key === key) || null;

export function isInRange(item, range) {
    if (!range) return true;
    const prix = Number(item.prix);
    return prix >= range.min && prix < range.max;
}
