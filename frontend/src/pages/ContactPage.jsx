// src/pages/ContactPage.jsx
import React, { useState, useRef, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { User, Mail, Phone, MessageSquare, Tag, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import styles from "../styles/pages/ContactPage.module.css";
import stylesBtn from "../styles/components/Button.module.css";
import stylesCaptcha from "../styles/components/Recaptcha.module.css";
import http from "../services/axiosInstance";
import useTheme from "../hooks/useTheme";

const MAX_MESSAGE = 1500;
const EMPTY_FORM = { nom: "", email: "", telephone: "", sujet: "", message: "" };
const SUJETS = ["Demande de devis", "Location de matériel", "Organisation d'événement", "Autre"];

export default function ContactPage() {
    const [form, setForm] = useState(EMPTY_FORM);
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [captchaToken, setCaptchaToken] = useState("");
    const recaptchaRef = useRef(null);
    const { theme } = useTheme();

    // Le captcha est recréé au changement de thème : l'ancien jeton n'est plus valable
    useEffect(() => setCaptchaToken(""), [theme]);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (error) setError("");
    }

    function resetCaptcha() {
        setCaptchaToken("");
        recaptchaRef.current?.reset();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!captchaToken) {
            setError("Merci de valider le captcha.");
            return;
        }

        setLoading(true);
        try {
            await http.post("/contact", {
                name: form.nom,
                email: form.email,
                phone: form.telephone,
                subject: form.sujet,
                message: form.message,
                recaptchaToken: captchaToken,
            });
            setSent(true);
            setForm(EMPTY_FORM);
        } catch (err) {
            console.error("Erreur lors de l'envoi du message:", err);
            const status = err?.response?.status;
            setError(
                status === 429
                    ? "Trop de messages envoyés. Merci de patienter une minute."
                    : err?.response?.data?.message && status === 400
                        ? err.response.data.message
                        : "Erreur lors de l'envoi du message. Merci de réessayer !"
            );
        } finally {
            resetCaptcha();
            setLoading(false);
        }
    }

    return (
        <section className={styles.contactSection}>
            <header className={styles.header}>
                <span className={styles.badge}>
                    <Mail size={16} aria-hidden="true" /> Contact
                </span>
                <h1 className={styles.title}>Contactez-nous</h1>
                <p className={styles.subtitle}>
                    Une question, un besoin spécifique, un devis personnalisé ?
                    Écrivez-nous, nous reviendrons vers vous rapidement.
                </p>
            </header>

            {sent ? (
                <div className={styles.confirmation} role="status">
                    <CheckCircle2 size={48} className={styles.confirmIcon} aria-hidden="true" />
                    <h2>Message envoyé !</h2>
                    <p>Merci pour votre message. Nous vous répondrons dès que possible.</p>
                    <button
                        type="button"
                        className={`${stylesBtn.button} ${stylesBtn.btnConnexion}`}
                        onClick={() => setSent(false)}
                    >
                        Envoyer un autre message
                    </button>
                </div>
            ) : (
                <form className={styles.contactForm} onSubmit={handleSubmit}>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label htmlFor="nom">Nom</label>
                            <div className={styles.inputWrap}>
                                <User size={18} className={styles.icon} aria-hidden="true" />
                                <input
                                    id="nom"
                                    type="text"
                                    name="nom"
                                    value={form.nom}
                                    onChange={handleChange}
                                    required
                                    maxLength={100}
                                    autoComplete="name"
                                    placeholder="Jean Dupont"
                                />
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="telephone">
                                Téléphone <span className={styles.optional}>(facultatif)</span>
                            </label>
                            <div className={styles.inputWrap}>
                                <Phone size={18} className={styles.icon} aria-hidden="true" />
                                <input
                                    id="telephone"
                                    type="tel"
                                    name="telephone"
                                    value={form.telephone}
                                    onChange={handleChange}
                                    maxLength={30}
                                    autoComplete="tel"
                                    placeholder="06 12 34 56 78"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="email">Email</label>
                        <div className={styles.inputWrap}>
                            <Mail size={18} className={styles.icon} aria-hidden="true" />
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                maxLength={254}
                                autoComplete="email"
                                placeholder="vous@exemple.fr"
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="sujet">
                            Sujet <span className={styles.optional}>(facultatif)</span>
                        </label>
                        <div className={styles.inputWrap}>
                            <Tag size={18} className={styles.icon} aria-hidden="true" />
                            <select id="sujet" name="sujet" value={form.sujet} onChange={handleChange}>
                                <option value="">Choisir un sujet…</option>
                                {SUJETS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="message">Votre message</label>
                        <div className={`${styles.inputWrap} ${styles.textareaWrap}`}>
                            <MessageSquare size={18} className={styles.icon} aria-hidden="true" />
                            <textarea
                                id="message"
                                name="message"
                                value={form.message}
                                onChange={handleChange}
                                required
                                rows={6}
                                maxLength={MAX_MESSAGE}
                                placeholder="Décrivez votre projet, la date, le lieu, le nombre d'invités…"
                                aria-describedby="message-count"
                            />
                        </div>
                        <span
                            id="message-count"
                            className={`${styles.counter} ${form.message.length > MAX_MESSAGE * 0.9 ? styles.counterWarn : ""}`}
                        >
                            {form.message.length} / {MAX_MESSAGE}
                        </span>
                    </div>

                    <div className={stylesCaptcha.container}>
                        {/* key : le widget Google ne change pas de thème à chaud, on le recrée */}
                        <ReCAPTCHA
                            key={theme}
                            ref={recaptchaRef}
                            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                            onChange={(t) => setCaptchaToken(t || "")}
                            onExpired={() => setCaptchaToken("")}
                            theme={theme}
                        />
                    </div>

                    <div aria-live="polite">
                        {error && (
                            <div className={styles.error} role="alert">
                                <AlertCircle size={18} aria-hidden="true" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <button
                        className={`${stylesBtn.button} ${stylesBtn.btnConnexion} ${styles.submit}`}
                        type="submit"
                        disabled={loading}
                        aria-busy={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className={styles.spin} aria-hidden="true" /> Envoi en cours…
                            </>
                        ) : (
                            <>
                                <Send size={18} aria-hidden="true" /> Envoyer le message
                            </>
                        )}
                    </button>
                </form>
            )}
        </section>
    );
}
