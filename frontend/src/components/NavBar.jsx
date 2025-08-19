import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from '../styles/components/NavBar.module.css';
import btnStyles from '../styles/components/Button.module.css';
import useLogo from '../hooks/useLogo';

export default function NavBar({ isAdmin, handleLogout, cart }) {
    const [showLoginButton, setShowLoginButton] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const logoUrl = useLogo();
    const menuRef = useRef();
    const navigate = useNavigate();
    const totalItems = cart.reduce((sum, item) => sum + item.quantite, 0);

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
                setShowLoginButton(true);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    useEffect(() => {
        if (!menuOpen) return;
        const closeMenu = (e) => {
            if (e.type === 'resize' || (e.type === 'keydown' && e.key === 'Escape')) {
                setMenuOpen(false);
            }
        };
        window.addEventListener('resize', closeMenu);
        window.addEventListener('keydown', closeMenu);
        if (menuRef.current) menuRef.current.querySelector('a,button').focus();
        return () => {
            window.removeEventListener('resize', closeMenu);
            window.removeEventListener('keydown', closeMenu);
        };
    }, [menuOpen]);

    return (
        <nav className={styles.navbar}>
            <div className={styles.navbarContainer}>
                <div className={styles.navbarLogo}>
                    <NavLink to="/">
                        <img src={logoUrl} loading="lazy" alt="Logo" />
                    </NavLink>
                </div>

                {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}

                <button
                    className={`${styles.burger} ${menuOpen ? styles.open : ''}`}
                    aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                    aria-expanded={menuOpen}
                    aria-controls="main-menu"
                    onClick={() => setMenuOpen(!menuOpen)}
                    tabIndex={0}
                >
                    <span />
                    <span />
                    <span />
                </button>

                <div
                    id="main-menu"
                    ref={menuRef}
                    className={`${styles.navbarLinks} ${menuOpen ? styles.active : ''}`}
                    tabIndex={menuOpen ? 0 : -1}
                >
                    <NavLink
                        to="/"
                        className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                        onClick={() => setMenuOpen(false)}
                        end
                    >
                        Accueil
                    </NavLink>
                    <NavLink
                        to="/shop"
                        className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                        onClick={() => setMenuOpen(false)}
                    >
                        Boutique
                    </NavLink>
                    <NavLink
                        to="/panier"
                        className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                        onClick={() => setMenuOpen(false)}
                    >
                        Panier {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
                    </NavLink>
                    {isAdmin && (
                        <>
                            <NavLink
                                to="/admin"
                                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                Admin
                            </NavLink>
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setMenuOpen(false);
                                    navigate('/');
                                }}
                                className={`${btnStyles.button} ${btnStyles.deconnexion}`}
                            >
                                Déconnexion
                            </button>
                        </>
                    )}
                    {showLoginButton && !isAdmin && (
                        <NavLink
                            to="/login"
                            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            Connexion admin
                        </NavLink>
                    )}
                </div>
            </div>
        </nav>
    );
}
