// backend/config/env.js
// À charger EN PREMIER (déjà fait dans app.js). Charge le .env, normalise les variables
// et signale ce qui manque, sans jamais afficher de valeur secrète.
const path = require('path');
const dotenv = require('dotenv');

// En local : lit backend/.env (ou le fichier indiqué par ENV_FILE).
// Sur Railway : pas de fichier, ce sont les variables du panneau qui servent (dotenv ne plante pas).
dotenv.config({
    path: process.env.ENV_FILE
        ? path.resolve(process.env.ENV_FILE)
        : path.resolve(__dirname, '..', '.env'),
});

// ---------- Noms de variables alternatifs ----------
const alias = (target, ...sources) => {
    if (process.env[target]) return;
    const found = sources.find((name) => process.env[name]);
    if (found) process.env[target] = process.env[found];
};

alias('BREVO_API_KEY', 'APIKEY_BREVO');
alias('RECAPTCHA_SECRET', 'RECAPTCHA_SECRET_KEY');
alias('RECAPTCHA_SECRET_KEY', 'RECAPTCHA_SECRET');
alias('EMAIL_TO', 'EMAIL_RECEIVER');
alias('EMAIL_RECEIVER', 'EMAIL_TO');


if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    missing.push('EMAIL_USER + EMAIL_PASS');
}

// ---------- Contrôle de configuration (noms uniquement, jamais les valeurs) ----------
const missing = [];
if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
if (!process.env.RECAPTCHA_SECRET) missing.push('RECAPTCHA_SECRET');
if (!process.env.CORS_ORIGINS && !process.env.CLIENT_URL) missing.push('CORS_ORIGINS (ou CLIENT_URL)');
if (!process.env.BREVO_API_KEY && !(process.env.EMAIL_USER && process.env.EMAIL_PASS)) {
    missing.push('BREVO_API_KEY (ou EMAIL_USER + EMAIL_PASS)');
}
if (missing.length) {
    console.error(`[config] Variables manquantes : ${missing.join(', ')}`);
}