const express = require('express');
const router = express.Router();
const { sendContactMail } = require('../services/emailService'); // ou autre chemin

router.post('/contact', async (req, res) => {
    const { nom, email, message } = req.body;
    try {
        await sendContactMail({ nom, email, message });
        res.status(200).json({ ok: true });
    } catch (err) {
        console.error("Erreur lors de l'envoi du mail de contact:", err);
        res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
});

module.exports = router;
