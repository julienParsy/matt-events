// src/pages/Contact.jsx
import React, { useState } from "react";
import styles from "../styles/pages/Contact.module.css";
import stylesBtn from "../styles/components/Button.module.css";

export default function Contact() {
    const [form, setForm] = useState({
        nom: "",
        email: "",
        message: "",
    });
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("http://localhost:3001/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error("Erreur serveur");
            setSent(true);
            setForm({ nom: "", email: "", message: "" });
        } catch {
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
                    <label>
                        Nom&nbsp;:
                        <input
                            type="text"
                            name="nom"
                            value={form.nom}
                            onChange={handleChange}
                            required
                            autoComplete="name"
                        />
                    </label>
                    <label>
                        Email&nbsp;:
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                        />
                    </label>
                    <label>
                        Votre message&nbsp;:
                        <textarea
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            required
                            rows={5}
                            maxLength={1500}
                        />
                    </label>
                        <button className={`${stylesBtn.button} ${stylesBtn.btnConnexion}`} type="submit">
                        Envoyer
                        </button>
                        {error && <div className={styles.error}>{error}</div>}
                        {loading && <div className={styles.loading}>Envoi en cours…</div>}

                </form>
            )}
            {/* <div className={styles.directContact}>
                <p>
                    <span role="img" aria-label="phone">📞</span> Par téléphone : <a href="tel:+33600000000">06 00 00 00 00</a>
                    <br />
                    <span role="img" aria-label="mail">📧</span> Par email : <a href="mailto:contact@mattevents.fr">contact@mattevents.fr</a>
                </p>
            </div> */}
        </section>
    );
}
