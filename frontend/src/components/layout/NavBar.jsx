// @feature layout — Barre de navigation (menu mobile, panier, thème, accès admin)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from '../../styles/components/NavBar.module.css';
import btnStyles from '../../styles/components/Button.module.css';
import { Sun, Moon } from 'lucide-react';
import useLogo from '../../hooks/useLogo';
import useTheme from '../../hooks/useTheme';

const FOCUSABLE = 'a[href], button:not([disabled])';

export default function NavBar({ isAdmin, handleLogout, cart }) {
    const [showLoginButton, setShowLoginButton] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const logoUrl = useLogo();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    // Thème clair : logo dédié (public/logo-light.svg) ; thème sombre : logo choisi dans l'admin
    const navLogo = isDark ? logoUrl : '/logo-light.svg';
    const menuRef = useRef(null);
    const burgerRef = useRef(null);
    const navigate = useNavigate();
    const totalItems = cart.reduce((sum, item) => sum + item.quantite, 0);

    const cartLabel = totalItems > 0
        ? `Panier, ${totalItems} article${totalItems > 1 ? 's' : ''}`
        : 'Panier';

    const closeMenu = useCallback((returnFocus = false) => {
        setMenuOpen(false);
        if (returnFocus) burgerRef.current?.focus();
    }, []);

    const linkClass = ({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`;

    // Raccourci caché : Ctrl + Alt + A affiche le lien de connexion admin
    useEffect(() => {
        const handleKeyPress = e => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
                setShowLoginButton(true);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    // On referme le menu si l'écran passe en mode ordinateur
    // (et non à chaque "resize", qui se déclenche aussi quand la barre d'adresse mobile bouge)
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 901px)');
        const onChange = e => { if (e.matches) setMenuOpen(false); };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    // Menu ouvert : Échap pour fermer, focus piégé dans le panneau, page bloquée derrière
    useEffect(() => {
        if (!menuOpen) return;

        const onKeyDown = e => {
            if (e.key === 'Escape') {
                closeMenu(true);
                return;
            }
            if (e.key !== 'Tab' || !menuRef.current) return;

            const items = menuRef.current.querySelectorAll(FOCUSABLE);
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement;

            if (!menuRef.current.contains(active)) {
                e.preventDefault();
                first.focus();
            } else if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        menuRef.current?.querySelector(FOCUSABLE)?.focus();

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [menuOpen, closeMenu]);

    return (
        <nav className={styles.navbar} aria-label="Navigation principale">
            <div className={styles.navbarContainer}>
                <div className={styles.navbarLogo}>
                    <NavLink to="/" aria-label="Accueil">
                        <img src={navLogo} width="88" height="88" fetchpriority="high" alt="Logo Matt'events" />
                    </NavLink>
                </div>

                {/* Fond derrière le panneau (toujours dans le DOM pour pouvoir s'estomper) */}
                <div
                    className={`${styles.overlay} ${menuOpen ? styles.overlayVisible : ''}`}
                    onClick={() => closeMenu(true)}
                    aria-hidden="true"
                />

                <div
                    id="main-menu"
                    ref={menuRef}
                    className={`${styles.navbarLinks} ${menuOpen ? styles.drawerOpen : ''}`}
                >
                    <div className={styles.drawerHeader}>
                        <span className={styles.drawerTitle}>Menu</span>
                        <button
                            type="button"
                            className={styles.drawerClose}
                            aria-label="Fermer le menu"
                            onClick={() => closeMenu(true)}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </div>

                    <NavLink to="/" className={linkClass} onClick={() => closeMenu()} end>
                        Accueil
                    </NavLink>
                    <NavLink to="/shop" className={linkClass} onClick={() => closeMenu()}>
                        Boutique
                    </NavLink>
                    {/* Lien « Panier » : uniquement dans le panneau mobile (l'icône suffit sur ordinateur) */}
                    <NavLink
                        to="/panier"
                        className={({ isActive }) => `${linkClass({ isActive })} ${styles.cartLink}`}
                        onClick={() => closeMenu()}
                    >
                        Panier
                        {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
                    </NavLink>

                    {(isAdmin || (showLoginButton && !isAdmin)) && (
                        <div className={styles.adminGroup}>
                            {isAdmin && (
                                <>
                                    <NavLink to="/admin" className={linkClass} onClick={() => closeMenu()}>
                                        Admin
                                    </NavLink>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleLogout();
                                            closeMenu();
                                            navigate('/');
                                        }}
                                        className={`${btnStyles.button} ${btnStyles.deconnexion} ${styles.logout}`}
                                    >
                                        Déconnexion
                                    </button>
                                </>
                            )}
                            {showLoginButton && !isAdmin && (
                                <NavLink to="/login" className={linkClass} onClick={() => closeMenu()}>
                                    Connexion admin
                                </NavLink>
                            )}
                        </div>
                    )}
                </div>

                {/* Panier toujours visible (ordinateur et mobile) + burger sur mobile */}
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.themeToggle}
                        onClick={toggleTheme}
                        aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
                        title={isDark ? 'Mode clair' : 'Mode sombre'}
                    >
                        {isDark
                            ? <Sun size={22} strokeWidth={1.8} aria-hidden="true" />
                            : <Moon size={22} strokeWidth={1.8} aria-hidden="true" />}
                    </button>

                    <NavLink
                        to="/panier"
                        className={({ isActive }) =>
                            `${styles.cartShortcut} ${isActive ? styles.cartShortcutActive : ''}`}
                        aria-label={cartLabel}
                    >
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
                            <circle cx="8" cy="21" r="1" />
                            <circle cx="19" cy="21" r="1" />
                            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                        </svg>
                        {totalItems > 0 && (
                            <span className={styles.cartShortcutBadge} aria-hidden="true">{totalItems}</span>
                        )}
                    </NavLink>

                    <button
                        ref={burgerRef}
                        type="button"
                        className={styles.burger}
                        aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                        aria-expanded={menuOpen}
                        aria-controls="main-menu"
                        onClick={() => (menuOpen ? closeMenu(true) : setMenuOpen(true))}
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>
            </div>
        </nav>
    );
}