// middlewares/verifyCaptcha.js
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = async function verifyCaptcha(req, res, next) {
    const { captchaToken } = req.body;

    if (!captchaToken) {
        return res.status(400).json({ message: 'reCAPTCHA manquant' });
    }

    try {
        const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
        const params = new URLSearchParams({
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: captchaToken,
        });

        const recaptchaRes = await fetch(verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        const data = await recaptchaRes.json();
        if (!data.success) {
            return res.status(400).json({ message: 'Échec de la vérification reCAPTCHA' });
        }

        next(); // ✅ continue
    } catch (err) {
        console.error('Erreur vérification reCAPTCHA:', err);
        res.status(500).json({ message: 'Erreur serveur reCAPTCHA' });
    }
};
