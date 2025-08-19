// backend/services/adminService.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

exports.fetchAllAdmins = async () => {
    const result = await pool.query(
        'SELECT id, email, role, created_at FROM admins ORDER BY id DESC'
    );
    return result.rows;
};

exports.createAdmin = async (email, mdp, role = 'admin') => {
    if (!['admin', 'superadmin'].includes(role)) role = 'admin';
    const hash = await bcrypt.hash(mdp, 10);
    const result = await pool.query(
        'INSERT INTO admins (email, mot_de_passe_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
        [email, hash, role]
    );
    return result.rows[0];
};

exports.deleteAdmin = async (id, actingAdminId) => {
    const adminId = Number(id);

    // Empêcher la suppression de soi-même
    if (adminId === Number(actingAdminId)) {
        const err = new Error("Impossible de supprimer votre propre compte.");
        err.status = 400;
        throw err;
    }

    // Récupérer l'admin cible
    const { rows: targetRows } = await pool.query('SELECT id, role FROM admins WHERE id=$1', [adminId]);
    const target = targetRows[0];
    if (!target) {
        const err = new Error("Admin introuvable.");
        err.status = 404;
        throw err;
    }

    // Si on supprime un superadmin, vérifier qu'il en reste au moins 1
    if (target.role === 'superadmin') {
        const { rows } = await pool.query("SELECT COUNT(*)::int AS c FROM admins WHERE role='superadmin' AND id<>$1", [adminId]);
        if (rows[0].c <= 0) {
            const err = new Error("Impossible de supprimer le dernier superadmin.");
            err.status = 400;
            throw err;
        }
    }

    await pool.query('DELETE FROM admins WHERE id = $1', [adminId]);
};

exports.getAdminById = async (id) => {
    const result = await pool.query('SELECT * FROM admins WHERE id = $1', [id]);
    return result.rows[0];
};

exports.changeAdminEmail = async (adminId, email, password) => {
    const admin = await exports.getAdminById(adminId);
    if (!admin) {
        const err = new Error("Admin non trouvé.");
        err.status = 404;
        throw err;
    }
    const isValid = await bcrypt.compare(password, admin.mot_de_passe_hash);
    if (!isValid) {
        const err = new Error("Mot de passe incorrect.");
        err.status = 401;
        throw err;
    }
    await pool.query('UPDATE admins SET email = $1, updated_at = NOW() WHERE id = $2', [email, adminId]);
};

exports.changeAdminPassword = async (adminId, currentPassword, newPassword) => {
    const admin = await exports.getAdminById(adminId);
    if (!admin) {
        const err = new Error("Admin non trouvé.");
        err.status = 404;
        throw err;
    }
    const isValid = await bcrypt.compare(currentPassword, admin.mot_de_passe_hash);
    if (!isValid) {
        const err = new Error("Mot de passe actuel incorrect.");
        err.status = 401;
        throw err;
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE admins SET mot_de_passe_hash = $1, updated_at = NOW() WHERE id = $2', [hash, adminId]);
};

// --- Rôles ---
exports.updateAdminRole = async (targetAdminId, newRole, actingAdminId) => {
    if (!['admin', 'superadmin'].includes(newRole)) {
        const err = new Error("Rôle invalide.");
        err.status = 400;
        throw err;
    }

    const targetId = Number(targetAdminId);

    // Récupérer l'admin cible
    const { rows: targetRows } = await pool.query('SELECT id, role FROM admins WHERE id=$1', [targetId]);
    const target = targetRows[0];
    if (!target) {
        const err = new Error("Admin introuvable.");
        err.status = 404;
        throw err;
    }

    // Empêcher de se rétrograder soi-même si on est le dernier superadmin
    if (target.role === 'superadmin' && newRole !== 'superadmin') {
        const { rows } = await pool.query("SELECT COUNT(*)::int AS c FROM admins WHERE role='superadmin' AND id<>$1", [targetId]);
        if (rows[0].c <= 0) {
            const err = new Error("Impossible de rétrograder le dernier superadmin.");
            err.status = 400;
            throw err;
        }
    }

    // Appliquer le rôle
    const { rows: updated } = await pool.query(
        'UPDATE admins SET role=$1, updated_at=NOW() WHERE id=$2 RETURNING id, email, role',
        [newRole, targetId]
    );
    return updated[0];
};

// --- LOGO ---
exports.setLogoUrl = async (url) => {
    // Table existante: logo_site(id, logo_url)
    await pool.query(`
    INSERT INTO logo_site (id, logo_url)
    VALUES (1, $1)
    ON CONFLICT (id) DO UPDATE SET logo_url = EXCLUDED.logo_url
  `, [url]);
};

exports.getLogoUrl = async () => {
    const result = await pool.query('SELECT logo_url FROM logo_site WHERE id = 1');
    return result.rows[0]?.logo_url || "";
};
