// /app/routes/contactRoutes.js
const router = require("express").Router();
const { sendMail } = require("../services/emailService");

router.post("/", async (req, res) => {
    try {
        const name = (req.body?.name || req.body?.nom || "").toString().trim();
        const email = (req.body?.email || "").toString().trim();
        const message = (req.body?.message || "").toString().trim();

        if (!email || !message) {
            return res.status(400).json({ message: "Email et message requis." });
        }

        await sendMail({
            replyTo: email,
            subject: `Nouveau message de contact${name ? " – " + name : ""}`,
            text: `De: ${name || "Anonyme"} <${email}>\n\n${message}`,
            html: `
        <p><strong>De:</strong> ${name || "Anonyme"} &lt;${email}&gt;</p>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
        });

        res.json({ ok: true });
    } catch (e) {
        console.error("CONTACT 500:", e?.code || e?.response || e?.message || e);
        res.status(500).json({ ok: false, error: "MAIL_SEND_FAILED" });
    }
});

module.exports = router;
