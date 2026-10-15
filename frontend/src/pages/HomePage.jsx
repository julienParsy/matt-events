// src/pages/HomePage.jsx
import { Link } from "react-router-dom";
import styles from "../styles/pages/HomePage.module.css";
import { shopLink } from "../utils/categories";

// Petites icônes SVG inline (aucune dépendance)
const Icon = ({ children }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
    >
        {children}
    </svg>
);

// cats : onglet(s) de la boutique ouverts par la carte (nom de la catégorie en minuscules, sans accents)
const UNIVERS = [
    {
        title: "Sonorisation",
        cats: ["son"],
        cta: "Voir la sonorisation",
        text: "Enceintes, tables de mixage, micros sans fil.",
        icon: (
            <Icon>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </Icon>
        ),
    },
    {
        title: "Éclairage",
        cats: ["projecteurs", "lyres-scanners"],
        cta: "Voir l'éclairage",
        text: "Lyres, projecteurs LED, ponts et pieds.",
        icon: (
            <Icon>
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
            </Icon>
        ),
    },
    {
        title: "Effets",
        cats: ["lasers", "machines-a-fumee"],
        cta: "Voir les effets",
        text: "Lasers, machines à fumée et à brouillard.",
        icon: (
            <Icon>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </Icon>
        ),
    },
    {
        title: "Packs clé en main",
        cats: ["packs"],
        cta: "Voir les packs",
        text: "Karaoké, buzzers, lumières : des packs prêts à l'emploi.",
        icon: (
            <Icon>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
            </Icon>
        ),
    },
];

const ETAPES = [
    {
        title: "Choisissez votre matériel",
        text: "Parcourez la boutique : matériel à l'unité ou packs prêts à l'emploi.",
    },
    {
        title: "Envoyez votre demande",
        text: "Ajoutez vos articles au panier et précisez les détails de votre événement.",
    },
    {
        title: "Recevez votre devis",
        text: "On revient vers vous avec un devis, et on vous conseille si besoin.",
    },
];

const EVENEMENTS = ["Mariages", "Soirées", "Concerts", "Fêtes d'entreprise", "et plus encore"];

export default function HomePage() {
    return (
        <div className={styles.page}>
            {/* ---------- Hero ---------- */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <p className={styles.eyebrow}>MATT'EVENTS · Location sono &amp; lumière</p>
                    <h1 className={styles.title}>
                        Sonorisation et éclairage pour vos <span className={styles.accent}>événements</span>
                    </h1>
                    <p className={styles.lead}>
                        MATT'EVENTS vous accompagne dans tous vos événements, du mariage au concert,
                        avec du matériel de sonorisation et d'éclairage à louer.
                    </p>

                    <div className={styles.actions}>
                        <Link to="/shop" className={styles.btnPrimary}>
                            Découvrir la boutique
                        </Link>
                        <Link to="/contact" className={styles.btnGhost}>
                            Nous contacter
                        </Link>
                    </div>

                    <ul className={styles.trust}>
                        <li>Matériel fiable</li>
                        <li>Conseils personnalisés</li>
                        <li>Une équipe à l'écoute</li>
                    </ul>
                </div>
            </section>

            {/* ---------- Types d'événements ---------- */}
            <section className={styles.events} aria-label="Types d'événements">
                <span className={styles.eventsLabel}>Pour tous vos événements</span>
                <ul className={styles.chips}>
                    {EVENEMENTS.map(e => (
                        <li key={e} className={styles.chip}>{e}</li>
                    ))}
                </ul>
            </section>

            {/* ---------- Matériel ---------- */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Notre matériel</h2>
                <p className={styles.sectionIntro}>
                    Tout ce qu'il faut pour mettre le son et la lumière à la hauteur de votre soirée.
                </p>
                <div className={styles.grid}>
                    {UNIVERS.map(u => (
                        <Link key={u.title} to={shopLink(u.cats)} className={styles.card}>
                            <span className={styles.cardIcon}>{u.icon}</span>
                            <h3 className={styles.cardTitle}>{u.title}</h3>
                            <p className={styles.cardText}>{u.text}</p>
                            <span className={styles.cardLink}>{u.cta} →</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ---------- Comment ça marche ---------- */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Comment ça marche</h2>
                <ol className={styles.steps}>
                    {ETAPES.map(e => (
                        <li key={e.title} className={styles.step}>
                            <h3 className={styles.stepTitle}>{e.title}</h3>
                            <p className={styles.stepText}>{e.text}</p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* ---------- Appel à l'action final ---------- */}
            <section className={styles.cta}>
                <h2 className={styles.ctaTitle}>Un événement en préparation ?</h2>
                <p className={styles.ctaText}>
                    Parlez-nous de votre projet, on vous aide à choisir le bon matériel.
                </p>
                <div className={styles.actions}>
                    <Link to="/contact" className={styles.btnPrimary}>
                        Nous contacter
                    </Link>
                    <Link to="/a-propos" className={styles.btnGhost}>
                        À propos de Matt'events
                    </Link>
                </div>
            </section>
        </div>
    );
}