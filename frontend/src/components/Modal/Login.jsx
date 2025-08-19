// src/components/Modal/Login.jsx
import { useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import axiosInstance from '../../services/axiosInstance';
import { AuthContext } from '../../contexts/AuthContext';
import modalStyles from '../../styles/components/Modal.module.css';
import btnStyles from '../../styles/components/Button.module.css';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMsg, setResetMsg] = useState('');
    const [showReset, setShowReset] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const { data } = await axiosInstance.post('/auth/login', { email, password });
            login(data.token, data.user);
            navigate('/admin');
        } catch (err) {
            console.error("❌ Erreur LOGIN:", err);
            setError(err.response?.data?.message || 'Une erreur est survenue');
        }
    };

    const handleReset = async e => {
        e.preventDefault();
        setResetMsg('');
        setResetLoading(true);
        try {
            await axiosInstance.post('/auth/forgot-password', { email: resetEmail });
            setResetMsg("Si cet email existe, un lien de réinitialisation a été envoyé.");
        } catch (err) {
            console.error("❌ Erreur reset-password:", err);
            setResetMsg("Erreur lors de la demande. Merci de réessayer.");
        } finally {
            setResetLoading(false);
        }
    };
    return (
        <div className={modalStyles.modalLogin}>
            <div className={modalStyles.modalContent}>
                {!showReset ? (
                    <form onSubmit={handleSubmit}>
                        <h2>Connexion</h2>
                        <p className={modalStyles.modalText}>Identifiants administrateur :</p>
                        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className={modalStyles.modalInput}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className={modalStyles.modalInput}
                            required
                        />
                        <button
                            type="submit"
                            className={`${btnStyles.button} ${btnStyles.btnConnexion}`}
                        >
                            Connexion
                        </button>
                        <div style={{ marginTop: 16 }}>
                            <button
                                type="button"
                                className={btnStyles.linkBtn}
                                onClick={() => setShowReset(true)}
                            >
                                Mot de passe oublié&nbsp;?
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleReset}>
                        <h2>Réinitialisation</h2>
                        <p className={modalStyles.modalText}>
                            Saisissez votre email pour recevoir un lien de réinitialisation.
                        </p>
                        <input
                            type="email"
                            placeholder="Votre email"
                            value={resetEmail}
                            onChange={e => setResetEmail(e.target.value)}
                            className={modalStyles.modalInput}
                            required
                        />
                        <button
                            type="submit"
                            className={`${btnStyles.button} ${btnStyles.btnConnexion}`}
                            disabled={resetLoading}
                        >
                            {resetLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
                        </button>
                        {resetMsg && (
                            <div style={{ color: '#1ca700', marginTop: 12 }}>{resetMsg}</div>
                        )}
                        <div style={{ marginTop: 16 }}>
                            <button
                                type="button"
                                className={btnStyles.linkBtn}
                                onClick={() => {
                                    setShowReset(false);
                                    setResetMsg('');
                                    setResetEmail('');
                                }}
                            >
                                Retour à la connexion
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
