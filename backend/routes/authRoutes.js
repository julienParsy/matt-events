// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const crypto = require('crypto');
const { sendMail } = require('../mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'uneCleSuperSecrete';

// POST /login (identique à ton code)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: 'Email et mot de passe requis' });

    try {
        const result = await pool.query(
            'SELECT id, email, mot_de_passe_hash, role FROM admins WHERE email = $1',
            [email]
        );
        const user = result.rows[0];
        if (!user) return res.status(401).json({ message: 'Identifiants invalides' });

        const isValid = await bcrypt.compare(password, user.mot_de_passe_hash);
        if (!isValid) return res.status(401).json({ message: 'Identifiants invalides' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Erreur de connexion admin :', err);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
});

// POST /forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis" });

    try {
        const result = await pool.query('SELECT id, email FROM admins WHERE email = $1', [email]);
        const user = result.rows[0];

        // Toujours renvoyer ok pour ne rien révéler
        if (!user) return res.json({ ok: true });

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 60); // 1h

        await pool.query(
            `UPDATE admins SET reset_password_token=$1, reset_password_expires=$2 WHERE id=$3`,
            [token, expires, user.id]
        );

        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;

        await sendMail({
            to: user.email,
            subject: 'Réinitialisation de mot de passe – Matt’events',
            text: `Bonjour,

Vous avez demandé la réinitialisation de votre mot de passe.
Lien valable 1h : ${resetUrl}

Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
            html: `
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p><a href="${resetUrl}" target="_blank" rel="noopener">Cliquez ici pour réinitialiser (valable 1h)</a></p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
      `,
        });

        res.json({ ok: true });
    } catch (err) {
        console.error("Erreur forgot-password :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// POST /reset-password/:token (inchangé)
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token et mot de passe requis" });

    try {
        const result = await pool.query(
            `SELECT id FROM admins WHERE reset_password_token=$1 AND reset_password_expires > NOW()`,
            [token]
        );
        const user = result.rows[0];
        if (!user) return res.status(400).json({ message: "Lien invalide ou expiré" });

        // Si tu veux appliquer tes règles (≥10 car., 1 maj, 1 chiffre, 1 spécial) côté back :
        const strong = /^(?=.*[A-Z])(?=.*\d)(?=.*[ !$&'()*+,\-./:;<=>?@[\]^_{|}~"#%])[A-Za-z\d !$&'()*+,\-./:;<=>?@[\]^_{|}~"#%]{10,}$/;
        if (!strong.test(password)) {
            return res.status(400).json({ message: "Mot de passe non conforme à la politique sécurité." });
        }

        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            `UPDATE admins SET mot_de_passe_hash=$1, reset_password_token=NULL, reset_password_expires=NULL WHERE id=$2`,
            [hash, user.id]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error("Erreur reset-password :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

module.exports = router;
