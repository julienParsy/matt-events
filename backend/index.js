// @feature core — Point d'entrée : démarre le serveur HTTP
const app = require('./app');
const { verifyEmailProvider } = require('./services/emailService');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`API up on :${PORT}`);

    // Test de la messagerie au démarrage (sans bloquer le serveur) :
    // une mauvaise config apparaît dans les logs avant la première demande client.
    verifyEmailProvider().then((r) => {
        if (r.ok) console.log(`[mail] Fournisseur "${r.provider}" opérationnel.`);
        else console.warn(`[mail] Fournisseur "${r.provider}" KO : ${r.error}`);
    });
});