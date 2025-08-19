const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'uneCleSuperSecrete';

// Vérifie que le token JWT est présent et valide
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer '))
        return res.status(401).json({ message: 'Token JWT manquant ou mal formé.' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, role }
        next();
    } catch (error) {
        console.error('Erreur vérification JWT :', error);
        return res.status(401).json({ message: 'Token JWT invalide ou expiré.' });
    }
}

// Autorise 'admin' ET 'superadmin'
function isAdmin(req, res, next) {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        return next();
    }
    return res.status(403).json({ message: 'Accès réservé aux admins.' });
}

// Autorise uniquement 'superadmin'
function isSuperAdmin(req, res, next) {
    if (req.user && req.user.role === 'superadmin') {
        return next();
    }
    return res.status(403).json({ message: 'Accès réservé au superadmin.' });
}

module.exports = { verifyToken, isAdmin, isSuperAdmin };
