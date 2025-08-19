require('dotenv').config();
const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const compression = require('compression');
const path = require('path');
const { UPLOAD_DIR } = require('./config/constants');
const errorHandler = require('./middleware/errorHandler');



// 2. Middlewares
app.use(compression());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5Mo
    abortOnLimit: true,
    safeFileNames: true,
    preserveExtension: true,
}));

// 3. Fichiers statiques
app.use('/uploads', express.static(UPLOAD_DIR));

// Sécurité des en-têtes HTTP
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "img-src": ["'self'", "data:", "blob:", "https:",
                "https://firebasestorage.googleapis.com",
                "https://*.firebasestorage.app",
                "https://storage.googleapis.com"
            ],
        },
    },
}));
app.disable('x-powered-by');

// 4. Routes
const pdfRoutes = require('./routes/pdfRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes')
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

// 5. Gestion des erreurs
app.use(errorHandler);

module.exports = app;
