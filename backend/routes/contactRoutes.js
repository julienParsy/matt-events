// /app/routes/contactRoutes.js
const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const verifyCaptcha = require("../middleware/verifyCaptcha");
const { sendMail } = require("../services/emailService");

// Limiteur anti-spam : 3 messages / minute / IP
const contactLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    message: { ok: false, error: "TOO_MANY_REQUESTS", message: "Trop de messages. Veuillez réessayer dans quelques instants." },
    standardHeaders: true,
    legacyHeaders: false,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX = { name: 100, email: 254, phone: 30, subject: 150, message: 1500 };

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Retire les retours à la ligne (évite l'injection d'en-têtes dans le sujet)
const oneLine = (s) => s.replace(/[\r\n]+/g, " ");

router.get('/ping', (_req,res)=>res.json({ ok:true }));

router.post("/", contactLimiter, verifyCaptcha, async (req, res) => {
    const field = (key, ...aliases) =>
        ([key, ...aliases].map((k) => req.body?.[k]).find((v) => v != null) ?? "").toString().trim();

    const name = oneLine(field("name", "nom"));
    const email = field("email");
    const phone = oneLine(field("phone", "telephone"));
    const subject = oneLine(field("subject", "sujet"));
    const message = field("message");

    if (!email || !message) {
        return res.status(400).json({ ok: false, error: "EMAIL_OR_MESSAGE_MISSING", message: "Email et message sont requis." });
    }
    if (!EMAIL_RE.test(email) || email.length > MAX.email) {
        return res.status(400).json({ ok: false, error: "EMAIL_INVALID", message: "Adresse email invalide." });
    }
    if (name.length > MAX.name || phone.length > MAX.phone || subject.length > MAX.subject || message.length > MAX.message) {
        return res.status(400).json({ ok: false, error: "FIELD_TOO_LONG", message: "Un des champs est trop long." });
    }

    const e = {
        name: escapeHtml(name || "Anonyme"),
        email: escapeHtml(email),
        phone: escapeHtml(phone),
        subject: escapeHtml(subject),
        message: escapeHtml(message).replace(/\n/g, "<br/>"),
    };

    try {
        await sendMail({
            to: process.env.EMAIL_TO || process.env.EMAIL_RECEIVER || process.env.EMAIL_USER,
            replyTo: email,
            subject: `Contact${subject ? " : " + subject : ""}${name ? " – " + name : ""}`,
            text: [
                `De : ${name || "Anonyme"} <${email}>`,
                ...(phone ? [`Téléphone : ${phone}`] : []),
                ...(subject ? [`Sujet : ${subject}`] : []),
                "",
                message,
            ].join("\n"),
            html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;color:#222">
          <h2 style="color:#308546;margin:0 0 16px">Nouveau message de contact</h2>
          <table style="border-collapse:collapse;margin-bottom:16px">
            <tr><td style="padding:4px 12px 4px 0;color:#666">De</td><td><strong>${e.name}</strong> &lt;<a href="mailto:${e.email}">${e.email}</a>&gt;</td></tr>
            ${phone ? `<tr><td style="padding:4px 12px 4px 0;color:#666">Téléphone</td><td><a href="tel:${e.phone}">${e.phone}</a></td></tr>` : ""}
            ${subject ? `<tr><td style="padding:4px 12px 4px 0;color:#666">Sujet</td><td>${e.subject}</td></tr>` : ""}
          </table>
          <div style="background:#f5f5f7;border-left:4px solid #646cff;padding:12px 16px;border-radius:4px;line-height:1.5">${e.message}</div>
          <p style="color:#999;font-size:12px;margin-top:16px">Répondez directement à cet email pour contacter ${e.name}.</p>
        </div>
      `,
        });

        res.json({ ok: true });
    } catch (err) {
        console.error("CONTACT 500:", err?.message || err);
        res.status(500).json({ ok: false, error: "MAIL_SEND_FAILED", message: "L'envoi du message a échoué." });
    }
});

module.exports = router;
