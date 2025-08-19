const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'uneCleSuperSecrete';

// Connexion admin
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

        // 🔥 Utiliser le rôle réel depuis la BDD
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        return res.json({
            token,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Erreur de connexion admin :', err);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis" });
    try {
        const result = await pool.query('SELECT id, email FROM admins WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) return res.json({ ok: true }); // Securité

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 60); // 1h

        await pool.query(
            `UPDATE admins SET reset_password_token=$1, reset_password_expires=$2 WHERE id=$3`,
            [token, expires, user.id]
        );

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Réinitialisation de mot de passe Matt Events',
            text: `Bonjour,\n\nCliquez sur ce lien pour réinitialiser votre mot de passe (valable 1h) : ${resetUrl}\n\nSi vous n'avez rien demandé, ignorez ce mail.`
        };

        await transporter.sendMail(mailOptions);

        res.json({ ok: true });
    } catch (err) {
        console.error("Erreur forgot-password :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Reset password
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
