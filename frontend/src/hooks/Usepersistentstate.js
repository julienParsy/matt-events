// src/hooks/usePersistentState.js
import { useEffect, useState } from 'react';

/**
 * useState synchronisé avec localStorage.
 * Usage (dans App.jsx) : const [cart, setCart] = usePersistentState('cart', []);
 */
export default function usePersistentState(key, initialValue) {
    const [state, setState] = useState(() => {
        try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : initialValue;
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch {
            /* stockage plein ou indisponible : on ignore */
        }
    }, [key, state]);

    return [state, setState];
}