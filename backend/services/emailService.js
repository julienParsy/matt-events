// /app/services/emailService.js
const nodemailer = require("nodemailer");

const USER = process.env.EMAIL_USER;
const PASS = process.env.EMAIL_PASS;
const HOST_PRIMARY = process.env.SMTP_HOST || "ssl0.ovh.net";
const HOST_FALLBACK = "smtp.mail.ovh.net";

const PORT = Number(process.env.SMTP_PORT || 465); // 465 ou 587 selon ENV
const SECURE = PORT === 465;                       // <-- clé du fix

function buildTransport(host, port) {
    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // <-- ne JAMAIS forcer true sur 587
        auth: { user: USER, pass: PASS },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 20000,
        greetingTimeout: 15000,
        socketTimeout: 30000,
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
        // logger: true, debug: true, // ← active pour debug seulement
    });
}

function isNetErr(err) {
    const s = String(err && (err.code || err.response || err.message || err));
    return /timeout|ETIMEDOUT|ECONNREFUSED|ESOCKET|EHOSTUNREACH|ECONNRESET|ENOTFOUND|TLSSocket|read ECONNRESET/i.test(s);
}

// transport primaire selon l'ENV
const primary = buildTransport(HOST_PRIMARY, PORT);

async function sendMail(opts) {
    const defaults = {
        from: `"Matt'events" <${process.env.FROM_EMAIL || USER}>`,
        to: process.env.EMAIL_TO || process.env.EMAIL_RECEIVER || USER,
        headers: { "X-Mailer": "Matt'events Mailer" },
    };
    const msg = { ...defaults, ...opts };

    try {
        return await primary.sendMail(msg);
    } catch (err) {
        if (!isNetErr(err)) throw err;

        // Fallback 1 : même host, autre port
        const otherPort = SECURE ? 587 : 465;
        try {
            const tAltPort = buildTransport(HOST_PRIMARY, otherPort);
            return await tAltPort.sendMail(msg);
        } catch (e2) {
            if (!isNetErr(e2)) throw e2;
        }

        // Fallback 2 : autre host (OVH), même autre port
        try {
            const tAltHost = buildTransport(HOST_FALLBACK, otherPort);
            return await tAltHost.sendMail(msg);
        } catch (e3) {
            throw e3; // toujours en échec → remonte l’erreur
        }
    }
}

async function verifySMTP() {
    try {
        await primary.verify();
        return { ok: true, host: HOST_PRIMARY, port: PORT };
    } catch (err) {
        if (!isNetErr(err)) throw err;
        const otherPort = SECURE ? 587 : 465;

        try {
            const tAltPort = buildTransport(HOST_PRIMARY, otherPort);
            await tAltPort.verify();
            return { ok: true, host: HOST_PRIMARY, port: otherPort };
        } catch (e2) {
            const tAltHost = buildTransport(HOST_FALLBACK, otherPort);
            await tAltHost.verify();
            return { ok: true, host: HOST_FALLBACK, port: otherPort };
        }
    }
}

module.exports = { sendMail, verifySMTP };
