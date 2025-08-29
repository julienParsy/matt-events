// /app/services/emailService.js
const nodemailer = require("nodemailer");

const HOST = process.env.SMTP_HOST || "ssl0.ovh.net";
const USER = process.env.EMAIL_USER;
const PASS = process.env.EMAIL_PASS;

function buildTransport({ port, secure }) {
    return nodemailer.createTransport({
        host: HOST,
        port,
        secure,                // 465 => true, 587 => false
        auth: { user: USER, pass: PASS },
        tls: { rejectUnauthorized: false },
        // ↓ évite les 2 minutes de blocage
        connectionTimeout: 20000,  // 20s
        greetingTimeout: 15000,
        socketTimeout: 30000,
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
        // Active les logs si besoin, désactive une fois ok
        logger: true, debug: true,
    });
}

const t465 = buildTransport({ port: Number(process.env.SMTP_PORT || 465), secure: true });

function isNetErr(err) {
    const msg = String(err && (err.code || err.response || err.message || err));
    return /ETIMEDOUT|ECONNREFUSED|ESOCKET|EHOSTUNREACH|ECONNRESET|ENOTFOUND|TLSSocket/i.test(msg);
}

async function sendMail(opts) {
    const defaults = {
        from: `"Matt'events" <${process.env.FROM_EMAIL || USER}>`,
        to: process.env.EMAIL_TO || process.env.EMAIL_RECEIVER || USER,
        headers: { "X-Mailer": "Matt'events Mailer" },
    };

    try {
        return await t465.sendMail({ ...defaults, ...opts });
    } catch (err) {
        // Fallback si problème réseau/port 465
        if (isNetErr(err)) {
            const t587 = buildTransport({ port: 587, secure: false });
            return await t587.sendMail({ ...defaults, ...opts });
        }
        throw err;
    }
}

async function verifySMTP() {
    try {
        await t465.verify();
        return { ok: true, port: 465 };
    } catch (err) {
        if (isNetErr(err)) {
            const t587 = buildTransport({ port: 587, secure: false });
            await t587.verify();
            return { ok: true, port: 587 };
        }
        throw err;
    }
}

module.exports = { sendMail, verifySMTP };
