// @feature auth — Hash bcrypt d'un mot de passe. Lancer : node utils/hashPassword.js <motdepasse>
const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
    console.error('❌ Veuillez fournir un mot de passe à hasher (ex: node hashPassword.js monMotDePasse)');
    process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('Erreur lors du hashage :', err);
        process.exit(1);
    }

    console.log('✅ Mot de passe hashé :');
    console.log(hash);
});
