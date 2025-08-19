// backend/controllers/adminController.js
const adminService = require('../services/adminService');

exports.getAdmins = async (req, res, next) => {
    try {
        const admins = await adminService.fetchAllAdmins();
        res.json(admins);
    } catch (err) { next(err); }
};

exports.addAdmin = async (req, res, next) => {
    try {
        const { email, mdp, role } = req.body;
        if (!email || !mdp) return res.status(400).json({ message: 'Email et mot de passe requis.' });
        const admin = await adminService.createAdmin(email, mdp, role || 'admin');
        res.status(201).json(admin);
    } catch (err) {
        if (err.code === '23505') res.status(409).json({ message: "Email déjà existant" });
        else next(err);
    }
};

exports.deleteAdmin = async (req, res, next) => {
    try {
        await adminService.deleteAdmin(req.params.id, req.user.id);
        res.json({ message: 'Admin supprimé' });
    } catch (err) { next(err); }
};

exports.changeAdminEmail = async (req, res, next) => {
    const adminId = req.user.id;
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Champs manquants." });
    try {
        await adminService.changeAdminEmail(adminId, email, password);
        res.json({ message: "Adresse e-mail modifiée !" });
    } catch (err) {
        if (err.code === '23505') res.status(409).json({ message: "Cet email existe déjà." });
        else next(err);
    }
};

exports.changeAdminPassword = async (req, res, next) => {
    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Champs manquants." });
    try {
        await adminService.changeAdminPassword(adminId, currentPassword, newPassword);
        res.json({ message: "Mot de passe modifié !" });
    } catch (err) { next(err); }
};

// --- Rôles ---
exports.updateAdminRole = async (req, res, next) => {
    const { id } = req.params;          // admin cible
    const { role } = req.body;          // 'admin' | 'superadmin'
    const actingId = req.user.id;       // celui qui agit
    if (!['admin', 'superadmin'].includes(role)) {
        return res.status(400).json({ message: "Rôle invalide" });
    }
    try {
        const updated = await adminService.updateAdminRole(id, role, actingId);
        res.json(updated);
    } catch (err) { next(err); }
};

// --- LOGO ---
exports.setLogoUrl = async (req, res, next) => {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ message: "URL manquante." });
    try {
        await adminService.setLogoUrl(url);
        const currentUrl = await adminService.getLogoUrl();
        res.json({ message: "Logo mis à jour.", url: currentUrl });
    } catch (err) { next(err); }
};

exports.getLogoUrl = async (_req, res, next) => {
    try {
        const url = await adminService.getLogoUrl();
        res.json({ url });
    } catch (err) { next(err); }
};
