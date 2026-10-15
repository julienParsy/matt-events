import { useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from '../../styles/components/Footer.module.css';
import footerRoutes from '../../data/footerRoutes.js';

// Accès admin discret (équivalent mobile de Ctrl + Alt + A) :
// 5 appuis rapides sur la ligne « © … » ouvrent la page de connexion.
const SECRET_TAPS = 5;
const SECRET_DELAY = 3000; // ms pour faire les 5 appuis

export default function Footer() {
    const navigate = useNavigate();
    const taps = useRef([]);

    const handleSecretTap = () => {
        const now = Date.now();
        taps.current = [...taps.current.filter(t => now - t < SECRET_DELAY), now];
        if (taps.current.length >= SECRET_TAPS) {
            taps.current = [];
            navigate('/login');
        }
    };

    return (
        <footer className={styles.footer}>
            <div className={styles.footerContainer}>
                <div className={styles.footerLinks}>
                    {footerRoutes.map(route => (
                        <NavLink
                            key={route.path}
                            to={route.path}
                            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                            end={route.exact || undefined}
                        >
                            {route.name}
                        </NavLink>
                    ))}
                </div>
                <div className={styles.copyright} onClick={handleSecretTap}>
                    &copy; {new Date().getFullYear()} Matt'events. Tous droits réservés.
                </div>
            </div>
        </footer>
    );
}
