// src/components/layout/ScrollToTopOnNavigate.jsx
// Remonte en haut de page quand on change de page (pas quand seuls les filtres ?cat=… changent).
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTopOnNavigate() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
