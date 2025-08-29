// /app/routes/contactRoutes.js
const router = require("express").Router();
const { sendMail } = require("../services/emailService");

router.get('/ping', (_req,res)=>res.json({ ok:true }));

router.post("/", async (req, res) => {
    try {
        const name = (req.body?.name || req.body?.nom || "").toString().trim();
        const email = (req.body?.email || "").toString().trim();
        const message = (req.body?.message || "").toString().trim();

        if (!email || !message) {
            return res.status(400).json({ ok: false, error: "EMAIL_OR_MESSAGE_MISSING" });
        }

        await sendMail({
            to: process.env.EMAIL_TO || process.env.EMAIL_RECEIVER || process.env.EMAIL_USER,
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
        const errMsg = e?.response || e?.message || e?.code || String(e);
        console.error("CONTACT 500:", {
            code: e?.code, response: e?.response, command: e?.command, port: e?.port
        });
        // TEMPORAIRE: renvoie l'erreur réelle pour diagnostiquer
        res.status(500).json({ ok: false, error: errMsg });
    }
});

module.exports = router;
