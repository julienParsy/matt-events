// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAdmins,
    addAdmin,
    deleteAdmin,
    changeAdminEmail,
    changeAdminPassword,
    setLogoUrl,
    getLogoUrl,
    updateAdminRole
} = require('../controllers/adminController');

const { verifyToken, isAdmin, isSuperAdmin } = require('../middleware/authMiddleware');

// --- Gestion des admins ---
// Liste des admins : superadmin uniquement
router.get('/', verifyToken, isSuperAdmin, getAdmins);

// Création d’un admin : superadmin uniquement
router.post('/', verifyToken, isSuperAdmin, addAdmin);

// Suppression d’un admin : superadmin uniquement
router.delete('/:id', verifyToken, isSuperAdmin, deleteAdmin);

// Changement de rôle : superadmin uniquement
router.patch('/:id/role', verifyToken, isSuperAdmin, updateAdminRole);

// Changer son propre email / mot de passe : admin (ou superadmin) connecté
router.post('/change-email', verifyToken, isAdmin, changeAdminEmail);
router.post('/change-password', verifyToken, isAdmin, changeAdminPassword);

// --- Logo: JSON { url } ---
router.post('/logo', verifyToken, isAdmin, (req, res, next) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "Champ 'url' manquant ou invalide." });
    }
    return setLogoUrl(req, res, next);
});

// Public (lu par le hook useLogo)
router.get('/logo', getLogoUrl);

module.exports = router;
