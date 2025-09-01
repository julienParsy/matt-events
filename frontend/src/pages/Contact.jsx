// src/pages/Contact.jsx
import React, { useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import styles from "../styles/pages/Contact.module.css";
import stylesBtn from "../styles/components/Button.module.css";
import stylesCaptcha from "../styles/components/Recaptcha.module.css";
import http from "../services/axiosInstance";

export default function Contact() {
    const [form, setForm] = useState({ nom: "", email: "", message: "" });
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [captchaToken, setCaptchaToken] = useState("");
    const recaptchaRef = useRef(null);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!captchaToken) {
            setError("Merci de valider le captcha");
            return;
        }

        setLoading(true);
        try {
            await http.post("/contact", { ...form, recaptchaToken: captchaToken });

            setSent(true);
            setForm({ nom: "", email: "", message: "" });
            setCaptchaToken("");
            recaptchaRef.current?.reset();
        } catch (err) {
            console.error("Erreur lors de l'envoi du message:", err);
            setError("Erreur lors de l'envoi du message. Merci de réessayer !");
            setSent(false);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className={styles.contactSection}>
            <h1 className={styles.title}>Contactez-nous</h1>
            <p className={styles.subtitle}>
                Une question, un besoin spécifique, un devis personnalisé ?<br />
                Remplissez le formulaire ci-dessous, nous reviendrons vers vous rapidement.
            </p>

            {sent ? (
                <div className={styles.confirmation}>
                    <p>
                        Merci pour votre message ! <br />
                        Nous vous répondrons dès que possible.
                    </p>
                </div>
            ) : (
                <form className={styles.contactForm} onSubmit={handleSubmit} autoComplete="off">
                    <label htmlFor="nom">
                        Nom&nbsp;:
                        <input
                            id="nom"
                            type="text"
                            name="nom"
                            value={form.nom}
                            onChange={handleChange}
                            required
                            autoComplete="name"
                        />
                    </label>

                    <label htmlFor="email">
                        Email&nbsp;:
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                        />
                    </label>

                    <label htmlFor="message">
                        Votre message&nbsp;:
                        <textarea
                            id="message"
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            required
                            rows={5}
                            maxLength={1500}
                        />
                    </label>

                    <div className={stylesCaptcha.container}>
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                            onChange={setCaptchaToken}
                        />
                    </div>

                    <button
                        className={`${stylesBtn.button} ${stylesBtn.btnConnexion}`}
                        type="submit"
                        disabled={loading}
                    >
                        Envoyer
                    </button>

                    {error && <div className={styles.error}>{error}</div>}
                    {loading && <div className={styles.loading}>Envoi en cours…</div>}
                </form>
            )}
        </section>
    );
}
