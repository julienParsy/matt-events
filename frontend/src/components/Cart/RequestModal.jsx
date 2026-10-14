// src/components/Cart/RequestModal.jsx
import React, { useEffect, useId, useRef } from 'react';
import PropTypes from 'prop-types';
import ReCAPTCHA from 'react-google-recaptcha';
import styles from '../../styles/components/Cart.module.css';
import modalStyles from '../../styles/components/Modal.module.css';
import stylesCaptcha from '../../styles/components/Recaptcha.module.css';
import useRequestForm from '../../hooks/userRequestForm';
import { toLocalISODate } from '../../utils/cart';

const FIELDS = [
    { name: 'nom', label: 'Nom', type: 'text', autoComplete: 'family-name' },
    { name: 'prenom', label: 'Prénom', type: 'text', autoComplete: 'given-name' },
    { name: 'telephone', label: 'Téléphone', type: 'tel', autoComplete: 'tel' },
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
];

const DELIVERY_OPTIONS = [
    { value: 'pickup', label: 'Retrait sur place (Erre, sur rendez-vous)' },
    { value: 'delivery', label: 'Livraison simple (sans montage/démontage)' },
    { value: 'setup', label: 'Livraison avec installation (montage/démontage)' },
];

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

export default function RequestModal({ cart, totalCount, onClose, onSuccess }) {
    const uid = useId();
    const dialogRef = useRef(null);
    const {
        form, errors, loading, submitError, needsAddress, wantsDownload, setWantsDownload,
        recaptchaRef, handleChange, handleCaptchaChange, handleCaptchaExpired, handleSubmit,
    } = useRequestForm({ cart, onSuccess });

    // Focus initial dans la modale, blocage du scroll, restitution du focus à la fermeture.
    useEffect(() => {
        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialogRef.current?.querySelector('input')?.focus();
        return () => {
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus?.();
        };
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !loading) {
            onClose();
            return;
        }
        if (e.key !== 'Tab') return;

        // Piège à focus : Tab / Maj+Tab restent dans la modale.
        const focusables = dialogRef.current?.querySelectorAll(FOCUSABLE);
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };

    const fieldId = (name) => `${uid}-${name}`;
    const errorId = (name) => `${uid}-${name}-error`;
    const inputA11y = (name) => ({
        id: fieldId(name),
        name,
        'aria-invalid': !!errors[name],
        'aria-describedby': errors[name] ? errorId(name) : undefined,
    });
    const renderError = (name) =>
        errors[name] ? (
            <p id={errorId(name)} role="alert" className={styles.error}>
                {errors[name]}
            </p>
        ) : null;

    return (
        <div className={modalStyles.modalOverlay} onKeyDown={handleKeyDown}>
            <div
                ref={dialogRef}
                className={modalStyles.modalContent}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${uid}-title`}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className={modalStyles.modalClose}
                    aria-label="Fermer la fenêtre"
                    disabled={loading}
                >
                    ✕
                </button>
                <h2 id={`${uid}-title`} className={modalStyles.modalTitle}>
                    Formulaire de demande
                </h2>
                <p className={styles.recap}>
                    {totalCount} article{totalCount > 1 ? 's' : ''} dans votre demande
                </p>

                <form onSubmit={handleSubmit} noValidate>
                    {FIELDS.map(({ name, label, type, autoComplete }) => (
                        <div key={name}>
                            <label htmlFor={fieldId(name)} className={modalStyles.modalLabel}>
                                {label} *
                            </label>
                            <input
                                {...inputA11y(name)}
                                type={type}
                                autoComplete={autoComplete}
                                value={form[name]}
                                onChange={handleChange}
                                className={modalStyles.modalInput}
                                aria-required="true"
                            />
                            {renderError(name)}
                        </div>
                    ))}

                    <div>
                        <label htmlFor={fieldId('eventDate')} className={modalStyles.modalLabel}>
                            Date de votre événement *
                        </label>
                        <input
                            {...inputA11y('eventDate')}
                            type="date"
                            value={form.eventDate}
                            onChange={handleChange}
                            className={modalStyles.modalInput}
                            min={toLocalISODate()}
                            aria-required="true"
                        />
                        {renderError('eventDate')}
                    </div>

                    <fieldset className={styles.optionsGroup}>
                        <legend className={modalStyles.modalLabel}>
                            Mode de retrait/livraison *
                        </legend>
                        <div className={styles.optionsRadioList}>
                            {DELIVERY_OPTIONS.map((opt) => (
                                <label key={opt.value} className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="deliveryType"
                                        value={opt.value}
                                        checked={form.deliveryType === opt.value}
                                        onChange={handleChange}
                                        className={styles.radioInput}
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                        {renderError('deliveryType')}
                    </fieldset>

                    {needsAddress && (
                        <div>
                            <label htmlFor={fieldId('adresse')} className={modalStyles.modalLabel}>
                                Adresse de livraison *
                            </label>
                            <input
                                {...inputA11y('adresse')}
                                type="text"
                                autoComplete="street-address"
                                value={form.adresse}
                                onChange={handleChange}
                                className={modalStyles.modalInput}
                                aria-required="true"
                            />
                            {renderError('adresse')}
                        </div>
                    )}

                    <div className={stylesCaptcha.container}>
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                            onChange={handleCaptchaChange}
                            onExpired={handleCaptchaExpired}
                        />
                    </div>
                    <div className={stylesCaptcha.container}>{renderError('captcha')}</div>

                    <label className={styles.downloadOption}>
                        <input
                            type="checkbox"
                            checked={wantsDownload}
                            onChange={(e) => setWantsDownload(e.target.checked)}
                        />
                        Télécharger le PDF après envoi
                    </label>

                    {submitError && (
                        <p role="alert" className={styles.error}>
                            {submitError}
                        </p>
                    )}

                    <div className={modalStyles.modalButtons}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={modalStyles.btnCancel}
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            aria-busy={loading}
                            className={styles.btnEmail}
                        >
                            {loading ? (
                                <>
                                    <span className={styles.spinner} aria-hidden="true" />
                                    <span className={styles.srOnly}>Envoi en cours</span>
                                </>
                            ) : (
                                'Envoyer la demande'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

RequestModal.propTypes = {
    cart: PropTypes.array.isRequired,
    totalCount: PropTypes.number.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
};
