// /app/services/emailService.js
//
// Envoi via SMTP OVH/Zimbra uniquement.
//
// Variables d'environnement :
//   EMAIL_USER / EMAIL_PASS   adresse complète + mot de passe du compte mail
//   SMTP_HOST / SMTP_PORT     défaut : smtp.mail.ovh.net / 587 (465 = SSL)
//   FROM_EMAIL                expéditeur (défaut : EMAIL_USER)
//   MAIL_SENDER_NAME          nom affiché (défaut : Matt'events)
//   EMAIL_TO                  destinataire par défaut (défaut : EMAIL_USER)
const nodemailer = require("nodemailer");

const FROM_NAME = process.env.MAIL_SENDER_NAME || "Matt'events";

function getConfig() {
    const user = process.env.EMAIL_USER;
    return {
        user,
        pass: process.env.EMAIL_PASS,
        host: process.env.SMTP_HOST || "smtp.mail.ovh.net",
        port: Number(process.env.SMTP_PORT || 587),
        fromEmail: process.env.FROM_EMAIL || process.env.MAIL_SENDER_EMAIL || user,
        defaultTo: process.env.EMAIL_TO || process.env.EMAIL_RECEIVER || user,
    };
}

let transporter = null; // créé une seule fois pour que le pool serve

function getTransporter() {
    if (transporter) return transporter;

    const { user, pass, host, port } = getConfig();
    if (!user || !pass) {
        throw new Error("Configuration e-mail incomplète : EMAIL_USER et EMAIL_PASS sont requis.");
    }

    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: port === 587,
        family: 4, // force IPv4 (évite des timeouts sur certains réseaux)
        auth: { user, pass },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
    });
    return transporter;
}

function logMailError(err) {
    const { user, host, port } = getConfig();
    if (err?.code === "EAUTH" || err?.responseCode === 535) {
        console.error(
            `[mail] Authentification SMTP refusée par ${host}:${port} pour "${user}". ` +
            "Vérifiez EMAIL_USER (adresse complète), EMAIL_PASS (guillemets si caractères spéciaux) et SMTP_HOST."
        );
    } else if (["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNREFUSED"].includes(err?.code)) {
        console.error(`[mail] Connexion impossible à ${host}:${port} (${err.code}). Port bloqué (hébergeur ?) ou serveur incorrect.`);
    }
    console.error("[mail:smtp]", err?.message || err);
}

async function sendMail({ to, subject, text, html, replyTo, attachments } = {}) {
    const { fromEmail, defaultTo } = getConfig();
    try {
        return await getTransporter().sendMail({
            from: `"${FROM_NAME}" <${fromEmail}>`,
            to: to || defaultTo,
            replyTo: replyTo || fromEmail,
            subject,
            text,
            html,
            attachments,
        });
    } catch (err) {
        logMailError(err);
        throw err;
    }
}

async function verifyEmailProvider() {
    try {
        await getTransporter().verify();
        return { ok: true, provider: "smtp" };
    } catch (err) {
        logMailError(err);
        return { ok: false, provider: "smtp", error: String(err?.message || err) };
    }
}

module.exports = { sendMail, verifyEmailProvider };