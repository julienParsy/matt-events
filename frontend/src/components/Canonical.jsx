// src/components/Canonical.jsx
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE = 'https://www.mattevents.fr'; // choisis www ou non-www et reste cohérent

export default function Canonical() {
    const { pathname } = useLocation();
    // supprime les / finaux (sauf la racine)
    const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    const href = `${BASE}${path}`;
    return (
        <Helmet>
            <link rel="canonical" href={href} />
        </Helmet>
    );
}
