// /app/services/emailService.js
const nodemailer = require("nodemailer");

const USER = process.env.EMAIL_USER;
const PASS = process.env.EMAIL_PASS;

const HOST_PRIMARY = process.env.SMTP_HOST || "smtp.mail.ovh.net"; // ← préfère smtp.mail.ovh.net
const HOST_FALLBACK = "ssl0.ovh.net";

const PORT = Number(process.env.SMTP_PORT || 587); // ← par défaut 587
const SECURE = PORT === 465;

function buildTransport(host, port) {
    return nodemailer.createTransport({
        name: process.env.SMTP_NAME || "api.mattevents.fr", // EHLO
        host,
        port,
        secure: port === 465,            // 465 = TLS implicite, 587 = STARTTLS
        requireTLS: port === 587,        // STARTTLS attendu sur 587
        family: 4,                       // ← force IPv4 (évite certains timeouts IPv6)
        auth: { user: USER, pass: PASS },
        tls: { rejectUnauthorized: false, servername: host },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
        // logger: true, debug: true, // active si besoin
    });
}

function isNetErr(err) {
    const s = String(err && (err.code || err.response || err.message || err));
    return /timeout|ETIMEDOUT|ECONNREFUSED|ESOCKET|EHOSTUNREACH|ECONNRESET|ENOTFOUND|TLSSocket|read ECONNRESET/i.test(s);
}

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

        // Fallback 1 : même host, port alternatif
        const otherPort = (PORT === 465) ? 587 : 465;
        try {
            const tAltPort = buildTransport(HOST_PRIMARY, otherPort);
            return await tAltPort.sendMail(msg);
        } catch (e2) {
            if (!isNetErr(e2)) throw e2;
        }

        // Fallback 2 : autre host (OVH), port alternatif
        const tAltHost = buildTransport(HOST_FALLBACK, otherPort);
        return await tAltHost.sendMail(msg);
    }
}

async function verifySMTP() {
    const targets = [
        { host: HOST_PRIMARY, port: PORT },
        { host: HOST_PRIMARY, port: PORT === 465 ? 587 : 465 },
        { host: HOST_FALLBACK, port: PORT === 465 ? 587 : 465 },
    ];

    for (const t of targets) {
        try {
            await buildTransport(t.host, t.port).verify();
            return { ok: true, host: t.host, port: t.port };
        } catch (e) {
            if (!isNetErr(e)) throw e;
        }
    }
    throw new Error("SMTP_UNREACHABLE");
}

module.exports = { sendMail, verifySMTP };
