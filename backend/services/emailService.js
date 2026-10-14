// /app/services/emailService.js
//
// Deux modes d'envoi, choisis automatiquement :
//   • Brevo (API HTTPS)  si BREVO_API_KEY est défini  → production sur Railway
//     (Railway bloque le SMTP sortant sur les offres Hobby, l'API HTTPS passe partout)
//   • SMTP (OVH par défaut) sinon                     → développement local
//
// Variables d'environnement :
//   BREVO_API_KEY      clé API Brevo (active le mode Brevo) ; APIKEY_BREVO est aussi accepté
//   MAIL_PROVIDER      optionnel : "smtp" ou "brevo" pour forcer un mode
//   FROM_EMAIL         expéditeur ; en mode Brevo il doit être un expéditeur validé dans Brevo
//   MAIL_SENDER_NAME   nom affiché (défaut : Matt'events)
//   EMAIL_TO           destinataire par défaut (défaut : EMAIL_USER)
//   --- mode SMTP uniquement ---
//   EMAIL_USER / EMAIL_PASS   adresse complète + mot de passe du compte mail
//   SMTP_HOST / SMTP_PORT     défaut : smtp.mail.ovh.net / 587 (465 = SSL)
const nodemailer = require("nodemailer");

const FROM_NAME = process.env.MAIL_SENDER_NAME || "Matt'events";

// fetch natif (Node 18+), sinon repli sur node-fetch
const doFetch = async (...args) => {
    if (typeof fetch !== "undefined") return fetch(...args);
    const { default: f } = await import("node-fetch");
    return f(...args);
};

// Lecture à l'appel (et non au chargement) : indépendant de l'ordre d'initialisation de dotenv.
function getConfig() {
    const user = process.env.EMAIL_USER;
    const fromEmail = process.env.FROM_EMAIL || process.env.MAIL_SENDER_EMAIL || user;
    return {
        user,
        pass: process.env.EMAIL_PASS,
        host: process.env.SMTP_HOST || "smtp.mail.ovh.net",
        port: Number(process.env.SMTP_PORT || 587),
        brevoKey: process.env.BREVO_API_KEY || process.env.APIKEY_BREVO,
        fromEmail,
        defaultTo: process.env.EMAIL_TO || process.env.EMAIL_RECEIVER || user || fromEmail,
    };
}

/** "brevo" si une clé existe, sinon "smtp". MAIL_PROVIDER=smtp|brevo permet de forcer. */
function getProvider() {
    const forced = (process.env.MAIL_PROVIDER || "").trim().toLowerCase();
    if (forced === "smtp" || forced === "brevo") return forced;
    return getConfig().brevoKey ? "brevo" : "smtp";
}

// ----------- Provider 1 : Brevo (API HTTPS, port 443) -----------
async function sendMailBrevo({ to, subject, text, html, replyTo, attachments }) {
    const { brevoKey, fromEmail } = getConfig();
    if (!brevoKey) throw new Error("Clé Brevo manquante (BREVO_API_KEY ou APIKEY_BREVO).");
    if (!fromEmail) throw new Error("FROM_EMAIL manquant (expéditeur Brevo).");

    const payload = {
        sender: { email: fromEmail, name: FROM_NAME },
        to: [{ email: to }],
        subject,
        replyTo: { email: replyTo || fromEmail },
        ...(text ? { textContent: text } : {}),
        ...(html ? { htmlContent: html } : {}),
    };

    if (attachments?.length) {
        payload.attachment = attachments.map((a) => ({
            name: a.filename || "file",
            content: Buffer.isBuffer(a.content)
                ? a.content.toString("base64")
                : Buffer.from(String(a.content)).toString("base64"),
        }));
    }

    const res = await doFetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevoKey, "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`BREVO_ERROR ${res.status}: ${body.slice(0, 500)}`);
    }
    return res.json();
}

// ----------- Provider 2 : SMTP (local / dev) -----------
let transporter = null; // créé une seule fois pour que le pool serve

function getTransporter() {
    if (transporter) return transporter;

    const { user, pass, host, port } = getConfig();
    if (!user || !pass) {
        throw new Error("Configuration e-mail incomplète : EMAIL_USER et EMAIL_PASS sont requis (ou BREVO_API_KEY).");
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

async function sendMailSMTP({ to, subject, text, html, replyTo, attachments }) {
    const { fromEmail } = getConfig();
    return getTransporter().sendMail({
        from: `"${FROM_NAME}" <${fromEmail}>`,
        to,
        replyTo: replyTo || fromEmail,
        subject,
        text,
        html,
        attachments,
    });
}

/** Diagnostic lisible dans les logs serveur (jamais renvoyé au navigateur). */
function logMailError(err, provider) {
    const { user, host, port } = getConfig();
    if (provider === "smtp") {
        if (err?.code === "EAUTH" || err?.responseCode === 535) {
            console.error(
                `[mail] Authentification SMTP refusée par ${host}:${port} pour "${user}". ` +
                "Vérifiez EMAIL_USER (adresse complète), EMAIL_PASS (guillemets si caractères spéciaux) et SMTP_HOST."
            );
        } else if (["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNREFUSED"].includes(err?.code)) {
            console.error(`[mail] Connexion impossible à ${host}:${port} (${err.code}). Port bloqué (hébergeur ?) ou serveur incorrect.`);
        }
    }
    console.error(`[mail:${provider}]`, err?.message || err);
}

// ----------- Façade -----------
async function sendMail(opts = {}) {
    const { defaultTo } = getConfig();
    const msg = { ...opts, to: opts.to || defaultTo };
    const provider = getProvider();

    try {
        return provider === "brevo" ? await sendMailBrevo(msg) : await sendMailSMTP(msg);
    } catch (err) {
        logMailError(err, provider);
        throw err;
    }
}

async function verifyEmailProvider() {
    if (getProvider() === "brevo") {
        const { brevoKey } = getConfig();
        try {
            if (!brevoKey) throw new Error("Clé Brevo manquante.");
            const res = await doFetch("https://api.brevo.com/v3/account", {
                headers: { "api-key": brevoKey, accept: "application/json" },
                signal: AbortSignal.timeout(10000),
            });
            if (!res.ok) throw new Error(`Brevo a répondu ${res.status} (clé API invalide ?)`);
            return { ok: true, provider: "brevo" };
        } catch (err) {
            logMailError(err, "brevo");
            return { ok: false, provider: "brevo", error: String(err?.message || err) };
        }
    }

    try {
        await getTransporter().verify();
        return { ok: true, provider: "smtp" };
    } catch (err) {
        logMailError(err, "smtp");
        return { ok: false, provider: "smtp", error: String(err?.message || err) };
    }
}

module.exports = { sendMail, verifyEmailProvider };