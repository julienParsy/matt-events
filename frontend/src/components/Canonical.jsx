import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE = 'https://www.mattevents.fr';

export default function Canonical({ title, description }) {
    const { pathname } = useLocation();

    // Politique sans slash final (sauf pour la racine)
    const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    const href = `${BASE}${path}`;

    return (
        <Helmet prioritizeSeoTags>
            {title && <title>{title}</title>}
            {description && <meta name="description" content={description} />}
            <link rel="canonical" href={href} />
        </Helmet>
    );
}
