// /app/services/emailService.js
const nodemailer = require("nodemailer");

// Utilise fetch global (Node 18+) sinon fallback dynamique vers node-fetch
const doFetch = async (...args) => {
    if (typeof fetch !== "undefined") return fetch(...args);
    const { default: f } = await import("node-fetch");
    return f(...args);
};

const USER = process.env.EMAIL_USER;
const PASS = process.env.EMAIL_PASS;

const FROM_EMAIL = process.env.FROM_EMAIL || process.env.MAIL_SENDER_EMAIL || USER;
const FROM_NAME = process.env.MAIL_SENDER_NAME || "Matt'events";
const DEFAULT_TO = process.env.EMAIL_TO || process.env.EMAIL_RECEIVER || USER || FROM_EMAIL;

// ----------- Provider 1: Brevo API (HTTPS 443) -----------
async function sendMailBrevo({ to, subject, text, html, replyTo, attachments }) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error("BREVO_API_KEY missing");

    const payload = {
        sender: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
        replyTo: { email: replyTo || FROM_EMAIL },
        attachment: (attachments || []).map(a => ({
            name: a.filename || "file",
            content: Buffer.isBuffer(a.content)
                ? a.content.toString("base64")
                : Buffer.from(String(a.content)).toString("base64"),
        })),
    };

    const r = await doFetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!r.ok) {
        const body = await r.text();
        throw new Error(`BREVO_ERROR ${r.status}: ${body.slice(0, 500)}`);
    }
    return r.json();
}

// ----------- Provider 2: SMTP (pour le local/dev) -----------
function buildSMTP() {
    const host = process.env.SMTP_HOST || "smtp.mail.ovh.net";
    const port = Number(process.env.SMTP_PORT || 587);
    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: port === 587,
        family: 4,
        auth: USER && PASS ? { user: USER, pass: PASS } : undefined,
        tls: { rejectUnauthorized: false, servername: host },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
    });
}

async function sendMailSMTP({ to, subject, text, html, replyTo, attachments }) {
    const transporter = buildSMTP();
    return transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to, replyTo: replyTo || FROM_EMAIL, subject, text, html, attachments,
    });
}

// ----------- Façade -----------
async function sendMail(opts) {
    const to = opts.to || DEFAULT_TO;
    const msg = { ...opts, to };

    if (process.env.BREVO_API_KEY) {
        return sendMailBrevo(msg);
    } else {
        return sendMailSMTP(msg); // utile en local
    }
}

async function verifyEmailProvider() {
    if (process.env.BREVO_API_KEY) return { ok: true, provider: "brevo" };
    try {
        await buildSMTP().verify();
        return { ok: true, provider: "smtp" };
    } catch (e) {
        return { ok: false, provider: "smtp", error: String(e?.message || e) };
    }
}

module.exports = { sendMail, verifyEmailProvider };
