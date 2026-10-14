// backend/utils/videoUrls.js
// Champ video_url : un ou plusieurs liens, un par ligne (8 maximum).
const MAX_VIDEOS = 8;

function parseVideoUrls(value) {
    if (!value) return [];
    return String(value).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function isHttpUrl(value) {
    try {
        const u = new URL(value);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

/** Renvoie un message d'erreur, ou '' si le champ est valide */
function checkVideoField(value, { maxLength } = {}) {
    if (value == null || value === '') return '';
    if (typeof value !== 'string') return 'Le champ vidéo doit être du texte.';
    const urls = parseVideoUrls(value);
    if (urls.length > MAX_VIDEOS) return `${MAX_VIDEOS} vidéos maximum.`;
    const bad = urls.findIndex(u => !isHttpUrl(u));
    if (bad !== -1) return `Le lien de la vidéo ${bad + 1} n'est pas une URL valide.`;
    if (maxLength && urls.join('\n').length > maxLength) return 'Trop de vidéos : limite de stockage atteinte.';
    return '';
}

/** Middleware Express pour les routes sans express-validator (packs) */
const validateVideoBody = ({ maxLength } = {}) => (req, res, next) => {
    const message = checkVideoField(req.body?.video_url, { maxLength });
    if (message) return res.status(400).json({ message });
    // Enregistre une forme propre (lignes vides retirées)
    if (typeof req.body?.video_url === 'string') req.body.video_url = parseVideoUrls(req.body.video_url).join('\n');
    next();
};

module.exports = { MAX_VIDEOS, parseVideoUrls, checkVideoField, validateVideoBody };
