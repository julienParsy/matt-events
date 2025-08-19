// utils/hashPassword.js
const bcrypt = require('bcrypt');

const password = process.argv[2]; // ex: node hashPassword.js admin

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
