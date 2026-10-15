// src/components/ui/ScrollRow.jsx
// Rangée de pastilles qui défile horizontalement (mobile), avec indices de défilement :
// fondus sur les bords, flèche qui rebondit (cachée dès que l'utilisateur a fait défiler),
// petit aperçu animé au premier affichage, et pastille active ramenée dans le champ.
// Sur ordinateur les pastilles passent à la ligne : aucun débordement, donc aucun indice.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import styles from '../../styles/components/ScrollRow.module.css';

const PEEK_KEY = 'scrollRowPeekDone';
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function ScrollRow({ className = '', children, ...rest }) {
    const ref = useRef(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);
    const [userScrolled, setUserScrolled] = useState(false);

    const update = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    // Suivi de la taille (rotation, chargement des catégories…)
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        Array.from(el.children).forEach(child => observer.observe(child));
        return () => observer.disconnect();
    }, [update, children]);

    // Pastille active hors champ : on la ramène dans la rangée (ex. « Son » depuis l'accueil)
    useEffect(() => {
        const el = ref.current;
        const active = el?.querySelector('[aria-pressed="true"]');
        if (!el || !active || el.scrollWidth <= el.clientWidth) return;
        const a = active.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        if (a.left < r.left || a.right > r.right) {
            el.scrollTo({ left: el.scrollLeft + a.left - r.left - 16, behavior: 'smooth' });
        }
    }, [children]);

    // Aperçu : la rangée glisse un peu puis revient (une fois par visite, pas si mouvements réduits)
    useEffect(() => {
        const el = ref.current;
        if (!el || !canRight || canLeft || reducedMotion()) return undefined;
        try {
            if (sessionStorage.getItem(PEEK_KEY)) return undefined;
            sessionStorage.setItem(PEEK_KEY, '1');
        } catch { /* stockage indisponible : on joue l'aperçu quand même */ }
        const t1 = setTimeout(() => el.scrollTo({ left: 56, behavior: 'smooth' }), 700);
        const t2 = setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 1300);
        return () => { clearTimeout(t1); clearTimeout(t2); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canRight]);

    // Seul un vrai geste masque la flèche (l'aperçu et l'aimantation font aussi défiler la rangée)
    const markInteracted = () => setUserScrolled(true);

    const scrollRight = () => {
        const el = ref.current;
        if (!el) return;
        el.scrollBy({ left: el.clientWidth * 0.7, behavior: reducedMotion() ? 'auto' : 'smooth' });
        setUserScrolled(true);
    };

    const fade = canLeft && canRight ? styles.fadeBoth : canRight ? styles.fadeRight : canLeft ? styles.fadeLeft : '';

    return (
        <div className={styles.wrap}>
            <div
                ref={ref}
                className={`${className} ${styles.row} ${fade}`}
                onScroll={update}
                onTouchStart={markInteracted}
                onWheel={markInteracted}
                onPointerDown={markInteracted}
                {...rest}
            >
                {children}
            </div>
            {canRight && !userScrolled && (
                <button
                    type="button"
                    className={styles.hint}
                    onClick={scrollRight}
                    aria-label="Faire défiler pour voir la suite"
                    tabIndex={-1}
                >
                    <ChevronRight size={18} aria-hidden="true" />
                </button>
            )}
        </div>
    );
}
