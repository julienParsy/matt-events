// @feature email
//
// Deux fournisseurs :
//   - Brevo (API HTTPS 443) : requis en prod sur Railway, qui bloque les ports SMTP sortants.
//   - SMTP OVH/Zimbra       : pratique en local.
//
// Variables d'environnement :
//   BREVO_API_KEY             si présente, Brevo est utilisé par défaut
//   MAIL_PROVIDER             optionnel : force "brevo" ou "smtp"
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

function getProvider() {
    const forced = (process.env.MAIL_PROVIDER || "").trim().toLowerCase();
    if (forced === "brevo" || forced === "smtp") return forced;
    return process.env.BREVO_API_KEY ? "brevo" : "smtp";
}

// ----------- Brevo (API HTTPS) -----------
async function sendMailBrevo({ to, subject, text, html, replyTo, attachments }) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error("Configuration e-mail incomplète : BREVO_API_KEY est requis.");
    const { fromEmail } = getConfig();

    const payload = {
        sender: { email: fromEmail, name: FROM_NAME },
        to: [{ email: to }],
        subject,
        ...(text ? { textContent: text } : {}),
        ...(html ? { htmlContent: html } : {}),
        replyTo: { email: replyTo || fromEmail },
    };
    if (attachments?.length) {
        payload.attachment = attachments.map((a) => ({
            name: a.filename || "file",
            content: Buffer.isBuffer(a.content)
                ? a.content.toString("base64")
                : Buffer.from(String(a.content)).toString("base64"),
        }));
    }

    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
    });
    if (!r.ok) {
        const body = await r.text();
        throw new Error(`BREVO_ERROR ${r.status}: ${body.slice(0, 500)}`);
    }
    return r.json();
}

async function verifyBrevo() {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error("BREVO_API_KEY manquant");
    const r = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": apiKey, Accept: "application/json" },
    });
    if (!r.ok) throw new Error(`BREVO_ERROR ${r.status}: ${(await r.text()).slice(0, 300)}`);
}

// ----------- SMTP -----------
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
    if (getProvider() === "brevo") {
        try {
            return await sendMailBrevo({ to: to || defaultTo, subject, text, html, replyTo, attachments });
        } catch (err) {
            console.error("[mail:brevo]", err?.message || err);
            throw err;
        }
    }
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
    if (getProvider() === "brevo") {
        try {
            await verifyBrevo();
            return { ok: true, provider: "brevo" };
        } catch (err) {
            return { ok: false, provider: "brevo", error: String(err?.message || err) };
        }
    }
    try {
        await getTransporter().verify();
        return { ok: true, provider: "smtp" };
    } catch (err) {
        logMailError(err);
        return { ok: false, provider: "smtp", error: String(err?.message || err) };
    }
}

module.exports = { sendMail, verifyEmailProvider };