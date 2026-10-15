// @feature core
// Gestionnaire d'erreurs central : détail complet dans les logs, message sûr pour le visiteur.
//
// - Erreurs prévues (status 4xx posé par le code) : leur message est affiché tel quel.
// - Erreurs PostgreSQL connues : traduites en message clair.
// - Tout le reste (500) : message générique, sans détail technique (tables, colonnes, requêtes…).

const PG_ERRORS = {
    '23503': [409, 'Cet élément est encore utilisé ailleurs : il ne peut pas être supprimé ou modifié ainsi.'],
    '23505': [409, 'Cet élément existe déjà.'],
    '22P02': [400, 'Donnée invalide.'],
};

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    console.error('[Erreur]', req.method, req.originalUrl, err.stack || err);

    const pg = PG_ERRORS[err.code];
    const status = pg ? pg[0] : (Number.isInteger(err.status) ? err.status : 500);
    const message = pg
        ? pg[1]
        : status < 500 && err.message
            ? err.message
            : 'Une erreur est survenue sur le serveur. Réessayez dans quelques instants.';

    res.status(status).json({ success: false, message });
}

module.exports = errorHandler;
