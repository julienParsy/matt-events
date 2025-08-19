// app.js
require('dotenv').config();
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

function isOriginAllowed(origin) {
    if (!origin) return true; // Postman/curl
    return rawOrigins.some(allowed => {
        if (allowed === origin) return true;
        // support "*.vercel.app"
        if (allowed.startsWith('*.') && origin.endsWith(allowed.slice(1))) return true;
        return false;
    });
}

app.use(cors({
    origin(origin, cb) {
        if (isOriginAllowed(origin)) return cb(null, true);
        return cb(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
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

app.use('/api/demande', pdfRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/packs', packRoutes);
app.use('/api', contactRoutes);
app.use('/api/pages', pageRoutes);

// 8) Gestion des erreurs (toujours en dernier)
app.use(errorHandler);

module.exports = app;
