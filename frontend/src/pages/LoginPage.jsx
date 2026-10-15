// src/pages/LoginPage.jsx
import { useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import {
    Mail, Lock, Eye, EyeOff, LogIn, Loader2, ShieldCheck,
    AlertCircle, CheckCircle2, ArrowLeft, Send,
} from 'lucide-react';
import axiosInstance from '../services/axiosInstance';
import { AuthContext } from '../contexts/AuthContext';
import styles from '../styles/pages/LoginPage.module.css';

function errorMessage(err, fallback) {
    const status = err?.response?.status;
    if (!err?.response) return 'Serveur injoignable. Vérifiez votre connexion et réessayez.';
    if (status === 429) return err.response.data?.message || 'Trop de tentatives. Réessayez plus tard.';
    if (status === 401) return 'Email ou mot de passe incorrect.';
    return err.response.data?.message || fallback;
}

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetStatus, setResetStatus] = useState(null); // null | { ok, msg }
    const [resetLoading, setResetLoading] = useState(false);

    const handleSubmit = async e => {
        e.preventDefault();
        if (loading) return;
        setError('');
        setLoading(true);
        try {
            const { data } = await axiosInstance.post('/auth/login', { email: email.trim(), password });
            login(data.token, data.user);
            navigate('/admin');
        } catch (err) {
            setError(errorMessage(err, 'Une erreur est survenue.'));
            setPassword('');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async e => {
        e.preventDefault();
        if (resetLoading) return;
        setResetStatus(null);
        setResetLoading(true);
        try {
            await axiosInstance.post('/auth/forgot-password', { email: resetEmail.trim() });
            setResetStatus({ ok: true, msg: 'Si cet email existe, un lien de réinitialisation vient d’être envoyé (valable 1 h).' });
        } catch (err) {
            setResetStatus({ ok: false, msg: errorMessage(err, 'Erreur lors de la demande. Merci de réessayer.') });
        } finally {
            setResetLoading(false);
        }
    };

    const openReset = () => {
        setResetEmail(email);
        setResetStatus(null);
        setShowReset(true);
    };

    const closeReset = () => {
        setShowReset(false);
        setResetStatus(null);
    };

    return (
        <section className={styles.wrapper}>
            <div className={styles.card}>
                <div className={styles.iconCircle} aria-hidden="true">
                    <ShieldCheck size={28} />
                </div>

                {!showReset ? (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <header className={styles.header}>
                            <h1 className={styles.title}>Espace administrateur</h1>
                            <p className={styles.subtitle}>Connectez-vous pour gérer le site.</p>
                        </header>

                        <div className={styles.field}>
                            <label htmlFor="login-email">Email</label>
                            <div className={styles.inputWrap}>
                                <Mail size={18} className={styles.icon} aria-hidden="true" />
                                <input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setError(''); }}
                                    required
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    placeholder="admin@mattevents.fr"
                                    aria-invalid={!!error}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="login-password">Mot de passe</label>
                            <div className={styles.inputWrap}>
                                <Lock size={18} className={styles.icon} aria-hidden="true" />
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(''); }}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••••"
                                    aria-invalid={!!error}
                                    className={styles.withToggle}
                                />
                                <button
                                    type="button"
                                    className={styles.toggle}
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div aria-live="polite" className={styles.live}>
                            {error && (
                                <div className={styles.alertError} role="alert">
                                    <AlertCircle size={18} aria-hidden="true" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        <button type="submit" className={styles.submit} disabled={loading} aria-busy={loading}>
                            {loading
                                ? <><Loader2 size={18} className={styles.spin} aria-hidden="true" /> Connexion…</>
                                : <><LogIn size={18} aria-hidden="true" /> Se connecter</>}
                        </button>

                        <button type="button" className={styles.link} onClick={openReset}>
                            Mot de passe oublié&nbsp;?
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleReset} className={styles.form}>
                        <header className={styles.header}>
                            <h1 className={styles.title}>Mot de passe oublié</h1>
                            <p className={styles.subtitle}>
                                Saisissez votre email pour recevoir un lien de réinitialisation.
                            </p>
                        </header>

                        <div className={styles.field}>
                            <label htmlFor="reset-email">Email</label>
                            <div className={styles.inputWrap}>
                                <Mail size={18} className={styles.icon} aria-hidden="true" />
                                <input
                                    id="reset-email"
                                    type="email"
                                    value={resetEmail}
                                    onChange={e => setResetEmail(e.target.value)}
                                    required
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    placeholder="admin@mattevents.fr"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div aria-live="polite" className={styles.live}>
                            {resetStatus && (
                                <div
                                    className={resetStatus.ok ? styles.alertSuccess : styles.alertError}
                                    role={resetStatus.ok ? 'status' : 'alert'}
                                >
                                    {resetStatus.ok
                                        ? <CheckCircle2 size={18} aria-hidden="true" />
                                        : <AlertCircle size={18} aria-hidden="true" />}
                                    <span>{resetStatus.msg}</span>
                                </div>
                            )}
                        </div>

                        <button type="submit" className={styles.submit} disabled={resetLoading} aria-busy={resetLoading}>
                            {resetLoading
                                ? <><Loader2 size={18} className={styles.spin} aria-hidden="true" /> Envoi en cours…</>
                                : <><Send size={18} aria-hidden="true" /> Envoyer le lien</>}
                        </button>

                        <button type="button" className={styles.link} onClick={closeReset}>
                            <ArrowLeft size={15} aria-hidden="true" /> Retour à la connexion
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
}
