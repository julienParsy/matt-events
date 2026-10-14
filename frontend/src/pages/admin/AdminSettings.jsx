// src/pages/admin/AdminSettings.jsx
import React, { useContext, useState } from 'react';
import { Settings, AtSign, KeyRound, Check, X, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../../services/axiosInstance';
import { AuthContext } from '../../contexts/AuthContext';
import AdminHeader from '../../components/admin/AdminHeader';
import { Alert, PasswordInput, SubmitButton } from '../../components/admin/FormControls';
import ui from '../../styles/components/AdminUI.module.css';
import styles from '../../styles/pages/AdminSettings.module.css';

// Mêmes règles que le backend (services/adminService.js)
const RULES = [
    { label: '10 caractères minimum', test: p => p.length >= 10 },
    { label: 'Une majuscule', test: p => /[A-Z]/.test(p) },
    { label: 'Un chiffre', test: p => /\d/.test(p) },
    { label: 'Un caractère spécial', test: p => /[^A-Za-z0-9]/.test(p) },
];

export default function AdminSettings() {
    const { token, user, login } = useContext(AuthContext);

    // Formulaire email (états séparés du formulaire mot de passe)
    const [email, setEmail] = useState('');
    const [emailPassword, setEmailPassword] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailError, setEmailError] = useState('');

    // Formulaire mot de passe
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdError, setPwdError] = useState('');

    const rulesOk = RULES.every(r => r.test(newPassword));
    const confirmMismatch = confirmPassword !== '' && confirmPassword !== newPassword;

    const handleEmailChange = async e => {
        e.preventDefault();
        if (!email.trim() || !emailPassword) { setEmailError('Renseignez le nouvel email et votre mot de passe.'); return; }
        setEmailLoading(true);
        setEmailError('');
        try {
            await axiosInstance.post('/admins/change-email', { email: email.trim(), password: emailPassword });
            toast.success('Adresse e-mail modifiée.');
            // Met à jour l'email affiché sans attendre la prochaine connexion
            if (user) login(token, { ...user, email: email.trim() });
            setEmail('');
            setEmailPassword('');
        } catch (err) {
            setEmailError(err.response?.data?.message || 'Erreur lors du changement d’e-mail.');
        } finally {
            setEmailLoading(false);
        }
    };

    const handlePasswordChange = async e => {
        e.preventDefault();
        if (!currentPassword) { setPwdError('Renseignez votre mot de passe actuel.'); return; }
        if (!rulesOk) { setPwdError('Le nouveau mot de passe ne respecte pas toutes les règles.'); return; }
        if (newPassword !== confirmPassword) { setPwdError('Les deux nouveaux mots de passe ne correspondent pas.'); return; }
        setPwdLoading(true);
        setPwdError('');
        try {
            await axiosInstance.post('/admins/change-password', { currentPassword, newPassword });
            toast.success('Mot de passe modifié.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPwdError(err.response?.data?.message || 'Erreur lors du changement du mot de passe.');
        } finally {
            setPwdLoading(false);
        }
    };

    return (
        <div>
            <AdminHeader
                icon={Settings}
                title="Paramètres"
                subtitle={user?.email ? `Connecté en tant que ${user.email}` : 'Votre compte administrateur.'}
            />

            <div className={ui.page}>
                <div className={ui.grid2}>
                    {/* ---------- Email ---------- */}
                    <section className={ui.panel}>
                        <div className={ui.panelHeader}>
                            <h2 className={ui.panelTitle}><AtSign size={20} aria-hidden="true" /> Adresse e-mail</h2>
                        </div>
                        <p className={ui.panelDesc}>Utilisée pour vous connecter et recevoir les liens de réinitialisation.</p>

                        <form className={ui.form} onSubmit={handleEmailChange} noValidate>
                            <Alert>{emailError}</Alert>
                            <div className={ui.field}>
                                <label className={ui.label} htmlFor="settings-email">Nouvelle adresse e-mail</label>
                                <input
                                    id="settings-email"
                                    className={ui.input}
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="email"
                                    autoCapitalize="none"
                                    placeholder="nouvelle@adresse.fr"
                                />
                            </div>
                            <div className={ui.field}>
                                <label className={ui.label} htmlFor="settings-email-password">Mot de passe actuel</label>
                                <PasswordInput
                                    id="settings-email-password"
                                    value={emailPassword}
                                    onChange={e => setEmailPassword(e.target.value)}
                                />
                            </div>
                            <div className={ui.formActions}>
                                <SubmitButton loading={emailLoading} icon={Save}>Modifier l’e-mail</SubmitButton>
                            </div>
                        </form>
                    </section>

                    {/* ---------- Mot de passe ---------- */}
                    <section className={ui.panel}>
                        <div className={ui.panelHeader}>
                            <h2 className={ui.panelTitle}><KeyRound size={20} aria-hidden="true" /> Mot de passe</h2>
                        </div>
                        <p className={ui.panelDesc}>Choisissez un mot de passe que vous n’utilisez nulle part ailleurs.</p>

                        <form className={ui.form} onSubmit={handlePasswordChange} noValidate>
                            <Alert>{pwdError}</Alert>
                            <div className={ui.field}>
                                <label className={ui.label} htmlFor="settings-current-password">Mot de passe actuel</label>
                                <PasswordInput
                                    id="settings-current-password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                />
                            </div>
                            <div className={ui.field}>
                                <label className={ui.label} htmlFor="settings-new-password">Nouveau mot de passe</label>
                                <PasswordInput
                                    id="settings-new-password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                    aria-describedby="password-rules"
                                />
                                <ul id="password-rules" className={styles.rules}>
                                    {RULES.map(r => {
                                        const ok = r.test(newPassword);
                                        return (
                                            <li key={r.label} className={ok ? styles.ruleOk : ''}>
                                                {ok ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
                                                {r.label}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                            <div className={ui.field}>
                                <label className={ui.label} htmlFor="settings-confirm-password">Confirmer le nouveau mot de passe</label>
                                <PasswordInput
                                    id="settings-confirm-password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    aria-invalid={confirmMismatch}
                                />
                                {confirmMismatch && <p className={styles.mismatch}>Les mots de passe ne correspondent pas.</p>}
                            </div>
                            <div className={ui.formActions}>
                                <SubmitButton loading={pwdLoading} icon={Save}>Modifier le mot de passe</SubmitButton>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}
