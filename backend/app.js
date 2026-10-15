// app.js
require('./config/env'); // charge le .env et normalise les variables (doit rester en premier)
const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const compression = require('compression');
const { UPLOAD_DIR } = require('./config/constants');
const errorHandler = require('./middleware/errorHandler');

// 0) Contexte proxy (Railway/GCP/Heroku)
app.set('trust proxy', 1);

// 1) Sécurité HTTP (headers)
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            // scripts/ifames/connexions nécessaires à reCAPTCHA v2
            "script-src": [
                "'self'",
                "'unsafe-inline'",          // reCAPTCHA injecte un peu d'inline
                "https://www.google.com",
                "https://www.gstatic.com",
                "https://www.recaptcha.net",
            ],
            "frame-src": [
                "'self'",
                "https://www.google.com",
                "https://www.recaptcha.net",
            ],
            "connect-src": [
                "'self'",
                "https://www.google.com",
                "https://www.gstatic.com",
                "https://www.recaptcha.net",
            ],
            // styles/images (tu avais déjà l'img-src Firebase)
            "style-src": [
                "'self'",
                "'unsafe-inline'",          // requis par le widget
                "https:",
                "https://www.google.com",
                "https://www.gstatic.com",
            ],
            "img-src": [
                "'self'",
                "data:",
                "blob:",
                "https:",
                "https://firebasestorage.googleapis.com",
                "https://*.firebasestorage.app",
                "https://storage.googleapis.com",
                "https://www.google.com",
                "https://www.gstatic.com",
            ],
            "font-src": [
                "'self'",
                "data:",
                "https://fonts.gstatic.com",
                "https://www.gstatic.com",
            ],
        },
    },
}));

app.disable('x-powered-by');

// 2) Compression & parsers
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 3) CORS — plusieurs origines (CSV dans CORS_ORIGINS) + support wildcard *.vercel.app
const rawOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean); // ex: "http://localhost:5173,https://mon-site.vercel.app,https://ton-domaine.fr"

const escapeRegex = (str) => str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

// "https://*.vercel.app" ou "*.vercel.app" : * = un seul sous-domaine (lettres, chiffres, tirets)
const originMatchers = rawOrigins.map((allowed) => {
    if (!allowed.includes('*')) return (origin) => origin === allowed;
    const pattern = allowed.includes('://') ? allowed : `https?://${allowed}`;
    const regex = new RegExp(`^${pattern.split('*').map(escapeRegex).join('[a-z0-9-]+')}$`, 'i');
    return (origin) => regex.test(origin);
});

function isOriginAllowed(origin) {
    if (!origin) return true; // Postman/curl, appels serveur à serveur
    return originMatchers.some((matches) => matches(origin));
}

app.use(cors({
    origin(origin, cb) {
        if (isOriginAllowed(origin)) return cb(null, true);
        console.warn(`[cors] Origine refusée : ${origin}`);
        return cb(null, false); // pas d'en-têtes CORS : le navigateur bloque, sans erreur 500
    },
    credentials: true,
    // Le site lit le nom des PDF téléchargés (ex. facture_F-2026-0001.pdf)
    exposedHeaders: ['Content-Disposition', 'X-Facture-Existante'],
    optionsSuccessStatus: 204,
}));

// 4) Uploads
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
    abortOnLimit: true,
    safeFileNames: true,
    preserveExtension: true,
}));

// 5) Fichiers statiques
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1d', immutable: true }));

// 6) Healthcheck (Railway)
app.get('/health', (_req, res) => res.send('ok'));

// 7) Routes
const pdfRoutes = require('./routes/pdfRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productsRoutes');
const categoriesRoutes = require('./routes/categoryRoutes');
const packRoutes = require('./routes/packRoutes');
const contactRoutes = require('./routes/contactRoutes');
const pageRoutes = require('./routes/pageRoutes');
const sousCategorieRoutes = require('./routes/sousCategorieRoutes');
const factureRoutes = require('./routes/factureRoutes');

if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEBUG_ROUTES === 'true') {
    app.use('/api/debug', require('./routes/debugRoutes'));
}


app.use('/api/demande', pdfRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/packs', packRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/sous-categories', sousCategorieRoutes);
app.use('/api/factures', factureRoutes);



// 8) Gestion des erreurs (toujours en dernier)
app.use(errorHandler);

module.exports = app;