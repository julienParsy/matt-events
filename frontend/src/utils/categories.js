// src/utils/categories.js
// Identifiants lisibles pour les onglets de la boutique (adresse /shop?cat=...)

export const PACKS_KEY = 'packs';

/** "Lyres & Scanners" → "lyres-scanners", "Machines à fumée" → "machines-a-fumee" */
export function slugify(name) {
    return String(name || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** Lien vers un ou plusieurs onglets : shopLink('son'), shopLink(['projecteurs', 'lyres-scanners']) */
export function shopLink(slugs) {
    const list = [].concat(slugs || []).filter(Boolean);
    return list.length ? `/shop?cat=${list.join(',')}` : '/shop';
}
