// @feature catalogue
// Vidéos d'un produit / pack : plusieurs liens dans le champ video_url, un par ligne
// (compatible avec les anciennes fiches qui n'en contiennent qu'un).

export const MAX_VIDEOS = 8;

/** Texte du champ video_url → liste de liens */
export function parseVideoUrls(value) {
    if (!value) return [];
    return String(value)
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean);
}

/** Liste de liens → texte du champ video_url */
export function serializeVideoUrls(urls) {
    return urls.map(u => normalizeVideoUrl(u.trim())).filter(Boolean).join('\n');
}

/** Identifiant YouTube (watch, youtu.be, embed, shorts, live, mobile), ou null */
export function getYoutubeId(url) {
    if (!url) return null;
    const m = String(url).match(
        /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/
    );
    return m ? m[1] : null;
}

/** Les Shorts sont verticaux (9:16) */
export const isShort = url => /youtube\.com\/shorts\//.test(url || '');

/** Lien court à l'enregistrement (https://youtu.be/ID) : tient dans les colonnes limitées */
export function normalizeVideoUrl(url) {
    const id = getYoutubeId(url);
    if (!id) return url;
    return isShort(url) ? `https://youtube.com/shorts/${id}` : `https://youtu.be/${id}`;
}

/** URL du lecteur intégré (sans cookies publicitaires, sans vidéos d'autres chaînes à la fin) */
export function toEmbedUrl(url, { autoplay = false } = {}) {
    const id = getYoutubeId(url);
    if (!id) return url;
    const params = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' });
    if (autoplay) params.set('autoplay', '1');
    return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

/** Miniature YouTube, ou null */
export function getThumbnail(url) {
    const id = getYoutubeId(url);
    return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
}

/** Lien http(s) valide ? */
export function isValidUrl(url) {
    try {
        const u = new URL(url);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Vérifie la liste saisie dans l'admin. Renvoie un message d'erreur, ou ''.
 * maxLength : taille maximale du champ en base (packs : 255 caractères)
 */
export function validateVideos(urls, { maxLength } = {}) {
    const filled = urls.map(u => u.trim()).filter(Boolean);
    if (filled.length > MAX_VIDEOS) return `${MAX_VIDEOS} vidéos maximum.`;
    const bad = filled.findIndex(u => !isValidUrl(u));
    if (bad !== -1) return `Le lien de la vidéo ${bad + 1} n’est pas valide (il doit commencer par https://).`;
    if (maxLength && serializeVideoUrls(filled).length > maxLength) {
        return 'Trop de vidéos pour ce pack : retirez-en une (limite de stockage atteinte).';
    }
    return '';
}
