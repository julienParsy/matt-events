import React, { useState } from "react";
import axiosInstance from "../../services/axiosInstance";
import styles from '../../styles/pages/AdminSettings.module.css';
import NavAdmin from './NavAdmin';
import stylesBack from '../../styles/components/BackButton.module.css';
import formStyles from '../../styles/components/Modal.module.css';
import btnStyles from '../../styles/components/Button.module.css';
import { toast } from "react-toastify";

const AdminSettings = () => {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Handler changement d'email
    const handleEmailChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await axiosInstance.post("/admins/change-email", {
                email,
                password: currentPassword
            });
            toast.success("Adresse e-mail changée avec succès !");
            setEmail("");
            setCurrentPassword("");
        } catch (err) {
            setError(
                err.response?.data?.message || "Erreur lors du changement d'email."
            );
        } finally {
            setLoading(false);
        }
    };

    // Handler changement de mot de passe
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await axiosInstance.post("/admins/change-password", {
                currentPassword,
                newPassword,
            });
            toast.success("Mot de passe changé avec succès !");
            setNewPassword("");
            setCurrentPassword("");
        } catch (err) {
            setError(
                err.response?.data?.message || "Erreur lors du changement du mot de passe."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className='banner'>
                <h1>Paramètres administrateur</h1>

                <NavAdmin />
            </div>
            <div className={styles.adminSettings}>
                <nav className={stylesBack.breadcrumb}>
                    <span className={stylesBack.breadcrumbItem} onClick={() => window.location.href = '/admin'}>Admin</span>
                    <span className={stylesBack.breadcrumbSep}>/</span>
                    <span className={stylesBack.breadcrumbItemActive}>Paramètre</span>
                </nav>
                {error && <div className={styles.error}>{error}</div>}

                <section className={styles.section}>
                    <h3 className={styles.subtitle}>Changer mon adresse e-mail</h3>
                    <form className={formStyles.modalBody} onSubmit={handleEmailChange}>
                        <input
                            className={formStyles.modalInput}
                            type="email"
                            placeholder="Nouvelle adresse e-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            className={formStyles.modalInput}
                            type="password"
                            placeholder="Mot de passe actuel"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                        <button className={`${btnStyles.button} ${btnStyles.btnNew}`} type="submit" disabled={loading}>
                            Modifier l'e-mail
                        </button>
                    </form>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.subtitle}>Changer mon mot de passe</h3>
                    <form className={formStyles.modalBody} onSubmit={handlePasswordChange}>
                        <input
                            className={formStyles.modalInput}
                            type="password"
                            placeholder="Mot de passe actuel"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                        <input
                            className={formStyles.modalInput}
                            type="password"
                            placeholder="Nouveau mot de passe"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <button className={`${btnStyles.button} ${btnStyles.btnNew}`} type="submit" disabled={loading}>
                            Modifier le mot de passe
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default AdminSettings;
