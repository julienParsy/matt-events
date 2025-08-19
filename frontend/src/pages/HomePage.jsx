// src/pages/HomePage.jsx
import { Link } from "react-router-dom";
import useLogo from '../hooks/useLogo';
import styles from "../styles/pages/HomePage.module.css";

export default function HomePage() {
    const logoUrl = useLogo();

    return (
        <div >
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <img src={logoUrl} alt="Logo" className={styles.logo} loading="lazy" />
                    <h1 className={styles.title}>MATT'EVENTS</h1>
                    <h3 className={styles.subtitle}>
                        Location de matériel <br />
                        de sonorisation et d’éclairage
                    </h3>
                <p>
                    <b>MATT'EVENTS</b> vous accompagne dans tous vos événements : mariages, soirées, concerts, fêtes d'entreprise et plus encore.<br />
                    <b>Du matériel fiable, des conseils personnalisés, une équipe à l’écoute !</b>
                </p>
                </div>
            </section>
            <section className={styles.categories}>
                <div className={styles.catGrid}>
                    <Link to="/contact" className={styles.catCard}>
                        Contactez-nous
                    </Link>
                    <Link to="/shop" className={styles.catCard}>
                        La boutique
                    </Link>
                    <Link to="/a-propos" className={styles.catCard}>
                        À propos
                    </Link>
                </div>
            </section>

        </div>
    );
}
