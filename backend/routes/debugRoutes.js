// /app/routes/debugRoutes.js
const router = require("express").Router();
const { verifySMTP, sendMail } = require("../services/emailService");

router.get("/mail", async (_req, res) => {
    try {
        const v = await verifySMTP(); // te renvoie le port utilisé OK
        await sendMail({ subject: "Test SMTP Matt'events", text: "OK depuis le backend." });
        res.json({ ok: true, via: v });
    } catch (e) {
        console.error("DEBUG /mail:", e?.code || e?.response || e?.message || e);
        res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
});

module.exports = router;
