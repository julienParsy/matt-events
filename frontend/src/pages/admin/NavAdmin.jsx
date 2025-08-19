import { NavLink } from 'react-router-dom'; // <-- À la place de Link
import styles from '../../styles/components/NavBar.module.css';
import nav from '../../styles/components/CategoryNav.module.css';

export default function NavAdmin() {
    return (
        <nav className={nav.navCategory}>
            {/* className={`${styles.navbar} ${styles.admin}`} */}
            <div>
                <span>Administration :</span>
            </div>
            <NavLink
                to="/admin"
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                end
            >
                Produits
            </NavLink>
            <NavLink
                to="/admin/categories"
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
                Catégories
            </NavLink>
            <NavLink
                to="/admin/demandes"
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
                Demandes
            </NavLink>
            <NavLink
                to="/admin/utilisateurs"
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
                Administrateurs
            </NavLink>
            <NavLink
                to="/admin/parametres"
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
                Paramètres
            </NavLink>
            <NavLink
                to="/admin/logo"
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
                Logo & Favicon
            </NavLink>
            <div>
                <span>Edition de page :</span>
            </div>
            <NavLink
                to="/a-propos"
                className={styles.link}
                state={{ edit: true }}
            >
                À propos
            </NavLink>
            <NavLink
                to="/confidentialite"
                className={styles.link}
                state={{ edit: true }}
            >
                Politique de confidentialité
            </NavLink>

        </nav>
    );
}
