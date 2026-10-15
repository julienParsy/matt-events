// @feature email — Diagnostic de la messagerie. Lancer : node scripts/checkMail.js
// N'affiche JAMAIS le mot de passe, seulement sa longueur.
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '..', '.env');
const fromFile = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
dotenv.config({ path: envPath });

console.log('Fichier lu        :', envPath, fs.existsSync(envPath) ? '' : '(INTROUVABLE)');
console.log('EMAIL_USER        :', JSON.stringify(process.env.EMAIL_USER));
console.log('SMTP_HOST / PORT  :', process.env.SMTP_HOST, '/', process.env.SMTP_PORT);
console.log('Longueur EMAIL_PASS (fichier) :', fromFile.EMAIL_PASS?.length);
console.log('Longueur EMAIL_PASS (utilisé) :', process.env.EMAIL_PASS?.length);
if (fromFile.EMAIL_PASS !== process.env.EMAIL_PASS || fromFile.EMAIL_USER !== process.env.EMAIL_USER) {
    console.log('⚠ Une variable système écrase le .env (EMAIL_USER/EMAIL_PASS définis dans Windows ou le terminal).');
}
console.log('Clé Brevo détectée :', !!(process.env.BREVO_API_KEY || process.env.APIKEY_BREVO));

const { verifyEmailProvider } = require('../services/emailService');
verifyEmailProvider().then((r) => { console.log('\nRésultat :', r); process.exit(r.ok ? 0 : 1); });