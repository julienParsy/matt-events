// backend/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "ssl0.ovh.net",
    port: Number(process.env.SMTP_PORT || 465),
    secure: true, // true pour 465
    auth: {
        user: process.env.EMAIL_USER, // ex: contact@mattevents.fr
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        // Railway peut être tatillon sur les certifs
        rejectUnauthorized: false,
    },
    // Anti timeouts si pics :
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
});

async function sendMail(opts) {
    const defaults = {
        from: `"Matt'events" <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO || process.env.EMAIL_RECEIVER || process.env.EMAIL_USER,
        headers: {
            "X-Priority": "3",
            "X-Mailer": "Matt'events Mailer",
        },
    };
    return transporter.sendMail({ ...defaults, ...opts });
}

module.exports = { transporter, sendMail };
