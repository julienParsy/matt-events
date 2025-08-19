import { NavLink } from 'react-router-dom';
import styles from '../styles/components/Footer.module.css';
import footerRoutes from '../data/footerRoutes.js';

export default function Footer() {
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
                <div className={styles.copyright}>
                    &copy; {new Date().getFullYear()} Matt'events. Tous droits réservés.
                </div>
            </div>   
        </footer>
    );  
}
