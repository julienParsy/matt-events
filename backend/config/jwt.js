// backend/config/jwt.js
// Secret JWT : obligatoire, sans valeur par défaut (une clé connue permettrait de forger un accès admin).
// Lu à l'appel (et non au chargement) pour ne pas dépendre de l'ordre des require.
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET manquant : impossible de signer ou vérifier les tokens.');
    return secret;
}

module.exports = { getJwtSecret };
