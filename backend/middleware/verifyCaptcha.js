// middlewares/verifyCaptcha.js
module.exports = async function verifyCaptcha(req, res, next) {
    try {
        const token =
            req.body.recaptchaToken || req.body.captchaToken || req.body.token;
        if (!token) return res.status(400).json({ message: 'reCAPTCHA manquant' });

        const SECRET =
            process.env.RECAPTCHA_SECRET || process.env.RECAPTCHA_SECRET_KEY;
        if (!SECRET) {
            return res.status(500).json({ message: 'Serveur: secret reCAPTCHA manquant' });
        }

        const params = new URLSearchParams({ secret: SECRET, response: token, remoteip: req.ip });
        const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            body: params
        });
        const data = await r.json();

        if (!data.success) {
            // aide au debug si besoin :
            console.warn('reCAPTCHA error-codes:', data['error-codes']);
            return res.status(400).json({ message: 'Échec reCAPTCHA', details: data['error-codes'] });
        }
        next();
    } catch (e) {
        console.error('reCAPTCHA verify error:', e?.message);
        res.status(502).json({ message: 'Vérification reCAPTCHA échouée' });
    }
};
