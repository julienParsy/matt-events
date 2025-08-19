import React, { useState } from 'react';
import Cart from '../components/Cart';
import ReCAPTCHA from 'react-google-recaptcha';
import styles from '../styles/components/Cart.module.css';
import modalStyles from '../styles/components/Modal.module.css';

const deliveryOptions = [
    { value: "pickup", label: "Retrait sur place (Erre, sur rendez-vous)" },
    { value: "delivery", label: "Livraison simple (sans montage/démontage)" },
    { value: "setup", label: "Livraison avec installation (montage/démontage)" },
];

const initialForm = {
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    eventDate: '',
    deliveryType: "pickup", // par défaut
};

export default function CartPage({ cart, setCart }) {
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [captchaToken, setCaptchaToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [wantsDownload, setWantsDownload] = useState(false);

    const validateForm = () => {
        const errs = {};
        if (!form.nom.trim()) errs.nom = 'Nom requis';
        if (!form.prenom.trim()) errs.prenom = 'Prénom requis';
        if (!form.telephone.trim() || !/^[0-9\s+()-]{8,}$/.test(form.telephone)) errs.telephone = 'Téléphone invalide';
        if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email invalide';
        if (!form.eventDate) {
            errs.eventDate = 'Date requise';
        } else {
            const selected = new Date(form.eventDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selected < today) {
                errs.eventDate = 'La date ne peut pas être antérieure à aujourd’hui';
            }
        }
        if (!form.deliveryType) errs.deliveryType = 'Choisissez une option de retrait/livraison';
        if (!captchaToken) errs.captcha = 'Veuillez valider le reCAPTCHA';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleUpdate = (id, newQty, stock) => {
        if (newQty >= 1 && newQty <= stock) {
            setCart(prev =>
                prev.map(item =>
                    item.id === id
                        ? { ...item, quantite: newQty }
                        : item
                )
            );
        }
    };

    const handleRemove = id => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCaptchaChange = (token) => {
        setCaptchaToken(token);
        if (token) {
            setErrors(prev => ({ ...prev, captcha: '' }));
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return alert('Panier vide.');
        if (!validateForm()) return;

        setLoading(true);
        setSuccessMessage('');

        try {
            // 1. Nouvelle structure propre :
            const payload = {
                client: { ...form },
                produits: cart,
                captchaToken,
                download: wantsDownload
            };

            const response = await fetch('http://localhost:3001/api/demande', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                alert("Erreur lors de l'envoi de la demande.");
                return;
            }

            const blob = await response.blob();

            if (wantsDownload) {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'demande.pdf';
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            }

            setShowModal(false);
            setForm(initialForm);
            setErrors({});
            setCart([]);
            setCaptchaToken(null);
            setWantsDownload(false);
            setSuccessMessage('Votre demande a bien été envoyée ! 🎉 Nous répondrons dans les meilleurs délais.');
        } catch (err) {
            console.error(err);
            alert('Erreur réseau');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div>
            <h1 className="banner">Votre Panier</h1>
            <Cart
                cart={cart}
                setCart={setCart}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
            />

            {successMessage && (
                <p className={styles.successMessage}>{successMessage}</p>
            )}

            <div className={styles.divDemande}>
                <p className={styles.totalText}>
                    Total d’articles : <strong>{cart.reduce((sum, item) => sum + item.quantite, 0)}</strong>
                </p>
                <button
                    onClick={() => setShowModal(true)}
                    className={styles.btnEmail}
                    disabled={cart.length === 0}
                    title={cart.length === 0 ? "Ajoutez des articles avant de faire une demande" : ""}
                >
                    Faire une demande
                </button>
            </div>


            {showModal && (
                <div className={modalStyles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div
                        className={modalStyles.modalContent}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowModal(false)}
                            className={modalStyles.modalClose}
                            aria-label='Fermer la fenêtre'
                        >
                            ✕
                        </button>
                        <h2 className={modalStyles.modalTitle}>Formulaire de demande</h2>
                        <form onSubmit={handleSend} noValidate>
                            {['nom', 'prenom', 'telephone', 'email'].map(field => (
                                <div key={field}>
                                    <label className={modalStyles.modalLabel}>
                                        {field.charAt(0).toUpperCase() + field.slice(1)} *
                                    </label>
                                    <input
                                        name={field}
                                        value={form[field]}
                                        onChange={handleChange}
                                        className={modalStyles.modalInput}
                                        aria-required="true"
                                        aria-invalid={!!errors[field]}
                                    />
                                    {errors[field] && (
                                        <p className={styles.error}>{errors[field]}</p>
                                    )}
                                </div>
                            ))}

                            <label className={modalStyles.modalLabel}>
                                Date de votre événement *
                            </label>
                            <input
                                type="date"
                                name="eventDate"
                                value={form.eventDate}
                                onChange={handleChange}
                                className={modalStyles.modalInput}
                                min={new Date().toISOString().split('T')[0]}
                                aria-required="true"
                                aria-invalid={!!errors.eventDate}
                            />
                            {errors.eventDate && (
                                <p className={styles.error}>{errors.eventDate}</p>
                            )}

                            <div className={styles.optionsGroup}>
                                <span className={modalStyles.modalLabel}>Mode de retrait/livraison *</span>
                                <div className={styles.optionsRadioList}>
                                    {deliveryOptions.map(opt => (
                                        <label key={opt.value} className={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                name="deliveryType"
                                                value={opt.value}
                                                checked={form.deliveryType === opt.value}
                                                onChange={handleChange}
                                                className={styles.radioInput}
                                            />
                                            <span className={styles.radioCustom} />
                                            {opt.label}
                                        </label>
                                    ))}
                                </div>
                                {errors.deliveryType && (
                                    <p className={styles.error}>{errors.deliveryType}</p>
                                )}
                            </div>


                            <div className="mt-3">
                                <ReCAPTCHA
                                    sitekey="6LdxMm0rAAAAAALWSN0j9iJTdu1Zplerr42N2a23"
                                    onChange={handleCaptchaChange}
                                />
                                {errors.captcha && (
                                    <p className={styles.error}>{errors.captcha}</p>
                                )}
                            </div>

                            <div className={styles.btnDiv}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={wantsDownload}
                                        onChange={e => setWantsDownload(e.target.checked)}
                                    />
                                    Télécharger le PDF après envoi
                                </label>
                            </div>

                            <div className={modalStyles.modalButtons}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className={modalStyles.btnCancel}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={!captchaToken || loading}
                                    className={styles.btnEmail}
                                >
                                    {loading
                                        ? <span className={styles.spinner} />
                                        : "Envoyer la demande"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
