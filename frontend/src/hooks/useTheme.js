// @feature layout
import { useCallback, useSyncExternalStore } from 'react';

/**
 * Thème clair / sombre, porté par l'attribut data-theme de <html>.
 * - Le script de index.html le pose avant le premier affichage (pas de flash).
 * - Sans choix enregistré, on suit le réglage du système (et ses changements).
 * Usage : const { theme, toggleTheme } = useTheme();
 */
const STORAGE_KEY = 'theme';
const root = document.documentElement;
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function getStoredTheme() {
    try {
        const t = localStorage.getItem(STORAGE_KEY);
        return t === 'light' || t === 'dark' ? t : null;
    } catch {
        return null;
    }
}

function applyTheme(theme) {
    root.dataset.theme = theme;
}

// Changement du thème système : appliqué seulement si l'utilisateur n'a rien choisi
systemDark.addEventListener('change', e => {
    if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light');
});

function subscribe(callback) {
    const observer = new MutationObserver(callback);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
}

const getSnapshot = () => (root.dataset.theme === 'light' ? 'light' : 'dark');

export default function useTheme() {
    const theme = useSyncExternalStore(subscribe, getSnapshot);

    const setTheme = useCallback(next => {
        applyTheme(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            /* stockage indisponible : le choix vaut pour la session */
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(getSnapshot() === 'dark' ? 'light' : 'dark');
    }, [setTheme]);

    return { theme, setTheme, toggleTheme };
}
