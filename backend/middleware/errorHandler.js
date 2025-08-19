// middleware/errorHandler.js

function errorHandler(err, req, res, next) {
    // Log interne
    console.error('[Erreur]', err.stack || err);

    // Personnalisation du format
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Erreur serveur interne",
        // optionnel en dev : stack: err.stack
    });
}

module.exports = errorHandler;
