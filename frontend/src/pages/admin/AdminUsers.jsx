// src/pages/admin/AdminUsers.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Users, UserPlus, Trash2, Crown, Shield, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../../services/axiosInstance';
import { AuthContext } from '../../contexts/AuthContext';
import AdminHeader from '../../components/admin/AdminHeader';
import Modal from '../../components/Modal/Modal';
import { Alert, PasswordInput, SubmitButton } from '../../components/admin/FormControls';
import ui from '../../styles/components/AdminUI.module.css';

const EMPTY_FORM = { email: '', mdp: '', role: 'admin' };

export default function AdminUsers() {
    const { user } = useContext(AuthContext);
    const isSuperAdmin = user?.role === 'superadmin';

    const [admins, setAdmins] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (isSuperAdmin) fetchAdmins();
    }, [isSuperAdmin]);

    const fetchAdmins = async () => {
        try {
            const res = await axiosInstance.get('/admins');
            setAdmins(res.data);
            setLoadError('');
        } catch (err) {
            setLoadError(err.response?.data?.message || 'Impossible de charger la liste des administrateurs.');
        }
    };

    const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const openModal = () => {
        setForm(EMPTY_FORM);
        setFormError('');
        setModalOpen(true);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!form.email.trim() || !form.mdp) { setFormError('Email et mot de passe sont requis.'); return; }
        setSaving(true);
        setFormError('');
        try {
            await axiosInstance.post('/admins', { ...form, email: form.email.trim() });
            toast.success('Administrateur ajouté.');
            setModalOpen(false);
            fetchAdmins();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Erreur lors de l’ajout.');
        } finally {
            setSaving(false);
        }
    };

    const changeRole = async (admin, role) => {
        try {
            await axiosInstance.patch(`/admins/${admin.id}/role`, { role });
            toast.success(`${admin.email} est maintenant ${role === 'superadmin' ? 'superadmin' : 'admin'}.`);
            fetchAdmins();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Impossible de changer le rôle.');
        }
    };

    const supprimer = async admin => {
        if (!window.confirm(`Supprimer l’administrateur ${admin.email} ?`)) return;
        try {
            await axiosInstance.delete(`/admins/${admin.id}`);
            toast.success('Administrateur supprimé.');
            fetchAdmins();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors de la suppression.');
        }
    };

    return (
        <div>
            <AdminHeader
                icon={Users}
                title="Administrateurs"
                subtitle="Comptes ayant accès à cet espace."
                actions={isSuperAdmin && (
                    <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={openModal}>
                        <UserPlus size={18} aria-hidden="true" /> Nouvel admin
                    </button>
                )}
            />

            <div className={`${ui.page} ${ui.pageNarrow}`}>
                {!isSuperAdmin ? (
                    <section className={ui.panel}>
                        <Alert type="info">
                            La gestion des comptes est réservée au superadmin. Pour modifier votre propre email
                            ou mot de passe, rendez-vous dans « Paramètres ».
                        </Alert>
                    </section>
                ) : (
                    <section className={ui.panel}>
                        <div className={ui.panelHeader}>
                            <h2 className={ui.panelTitle}>
                                <Users size={20} aria-hidden="true" /> Comptes
                                <span className={ui.count}>{admins.length}</span>
                            </h2>
                        </div>

                        {loadError && <Alert>{loadError}</Alert>}

                        {admins.length === 0 && !loadError ? (
                            <p className={ui.empty}>Aucun administrateur.</p>
                        ) : (
                            <ul className={ui.list}>
                                {admins.map(a => {
                                    const isMe = a.id === user?.id;
                                    const isSuper = a.role === 'superadmin';
                                    return (
                                        <li key={a.id} className={ui.listItem}>
                                            <span className={ui.listMain} title={a.email}>
                                                {a.email}
                                                {isMe && <span className={ui.listMeta}> (vous)</span>}
                                            </span>
                                            <span className={`${ui.tag} ${isSuper ? ui.tagWarning : ui.tagNeutral}`}>
                                                {isSuper ? <Crown size={13} aria-hidden="true" /> : <Shield size={13} aria-hidden="true" />}
                                                {isSuper ? 'Superadmin' : 'Admin'}
                                            </span>
                                            <div className={ui.listActions}>
                                                <button
                                                    type="button"
                                                    className={ui.iconBtn}
                                                    onClick={() => changeRole(a, isSuper ? 'admin' : 'superadmin')}
                                                    disabled={isMe}
                                                    aria-label={isSuper ? `Rétrograder ${a.email} en admin` : `Promouvoir ${a.email} superadmin`}
                                                    title={isMe ? 'Vous ne pouvez pas changer votre propre rôle' : isSuper ? 'Rétrograder en admin' : 'Promouvoir superadmin'}
                                                >
                                                    {isSuper ? <Shield size={16} /> : <Crown size={16} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`${ui.iconBtn} ${ui.iconBtnDanger}`}
                                                    onClick={() => supprimer(a)}
                                                    disabled={isMe}
                                                    aria-label={`Supprimer ${a.email}`}
                                                    title={isMe ? 'Vous ne pouvez pas supprimer votre propre compte' : 'Supprimer'}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                )}
            </div>

            {modalOpen && (
                <Modal isOpen size="sm" title="Nouvel administrateur" onClose={() => setModalOpen(false)}>
                    <form onSubmit={handleSubmit} className={ui.form} noValidate>
                        <Alert>{formError}</Alert>
                        <div className={ui.field}>
                            <label className={ui.label} htmlFor="new-admin-email">Email</label>
                            <input
                                id="new-admin-email"
                                className={ui.input}
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                autoComplete="off"
                                autoCapitalize="none"
                                placeholder="prenom@mattevents.fr"
                                autoFocus
                            />
                        </div>
                        <div className={ui.field}>
                            <label className={ui.label} htmlFor="new-admin-password">Mot de passe provisoire</label>
                            <PasswordInput
                                id="new-admin-password"
                                name="mdp"
                                value={form.mdp}
                                onChange={handleChange}
                                autoComplete="new-password"
                            />
                            <p className={ui.hint}>
                                <Lock size={12} aria-hidden="true" /> À changer par la personne dans « Paramètres » dès sa première connexion.
                            </p>
                        </div>
                        <div className={ui.field}>
                            <label className={ui.label} htmlFor="new-admin-role">Rôle</label>
                            <select id="new-admin-role" className={ui.select} name="role" value={form.role} onChange={handleChange}>
                                <option value="admin">Admin — gère le catalogue et les demandes</option>
                                <option value="superadmin">Superadmin — gère aussi les comptes</option>
                            </select>
                        </div>
                        <div className={ui.formActions}>
                            <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={() => setModalOpen(false)}>
                                Annuler
                            </button>
                            <SubmitButton loading={saving} icon={UserPlus}>Ajouter</SubmitButton>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
