import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import styles from '../styles/components/Modal.module.css';
import btnStyles from '../styles/components/Button.module.css';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setMsg('');
        if (password !== confirm) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        setLoading(true);
        try {
            await axiosInstance.post(`/auth/reset-password/${token}`, { password });
            setMsg("Votre mot de passe a bien été réinitialisé ! Vous pouvez vous connecter.");
            setTimeout(() => navigate('/login'), 2200);
        } catch (err) {
            setError(err.response?.data?.message || "Lien expiré ou erreur. Demandez un nouveau lien.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalLogin}>
            <form onSubmit={handleSubmit} className={styles.modalContent}>
            <h2>Réinitialisation du mot de passe</h2>
                <label className={styles.modalLabel}>
                    Nouveau mot de passe
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        autoFocus
                        minLength={8}
                        className={styles.modalInput}
                        autoComplete="new-password"
                    />
                </label>
                <label className={styles.modalLabel}>
                    Confirmer le mot de passe
                    <input
                        type="password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        required
                        minLength={8}
                        className={styles.modalInput}
                        autoComplete="new-password"
                    />
                </label>
                <button
                    type="submit"
                    className={`${btnStyles.button} ${btnStyles.btnConnexion}`}
                    disabled={loading}
                >
                    {loading ? "Réinitialisation en cours..." : "Réinitialiser"}
                </button>
                {msg && <div className={styles.success}>{msg}</div>}
                {error && <div className={styles.error}>{error}</div>}
            </form>
        </div>
    );
}
