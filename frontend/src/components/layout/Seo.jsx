// @feature seo
// Référencement : titre, description, indexation, adresse canonique et balises de partage de chaque page.
//
// Les balises existent déjà dans index.html (valeurs de l'accueil, lues par les robots qui n'exécutent pas
// le JavaScript, comme Facebook ou WhatsApp) : on met simplement à jour leur contenu à chaque page.
// (react-helmet-async n'ajoutait aucune balise sous React 19 : seul le titre changeait.)
//
// Valeurs par défaut selon l'adresse ; une page peut les préciser avec <Seo title=… description=… />.
import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const BASE = 'https://www.mattevents.fr';
const SITE = "Matt'events";

const DEFAULT_DESCRIPTION =
    "Location de sonorisation et d'éclairage près de Lille : enceintes, lyres, lasers, machines à fumée et packs clé en main " +
    "pour mariages, soirées, concerts et fêtes d'entreprise. Devis gratuit.";

// Pages publiques
const PAGES = {
    '/': {
        title: `Location sono & lumière pour vos événements – ${SITE}`,
        description: DEFAULT_DESCRIPTION,
    },
    '/shop': {
        title: `Boutique : location de matériel son et lumière – ${SITE}`,
        description: "Enceintes, consoles, lyres, projecteurs, lasers, machines à fumée et packs prêts à l'emploi : composez votre demande de location en ligne.",
    },
    '/contact': {
        title: `Contact et devis – ${SITE}`,
        description: "Une question, un devis personnalisé ? Contactez Matt'events, location de matériel son et lumière à Erre, près de Lille.",
    },
    '/a-propos': {
        title: `À propos – ${SITE}`,
        description: "Matt'events accompagne vos événements avec du matériel de sonorisation et d'éclairage fiable et des conseils personnalisés.",
    },
    '/confidentialite': {
        title: `Politique de confidentialité – ${SITE}`,
        description: "Comment Matt'events collecte et protège vos données personnelles.",
    },
    '/mentions-legales': {
        title: `Mentions légales – ${SITE}`,
        description: "Mentions légales du site Matt'events.",
    },
    '/panier': {
        title: `Votre panier – ${SITE}`,
        description: DEFAULT_DESCRIPTION,
        noindex: true,
    },
};

// Pages privées : jamais indexées (titre affiché dans l'onglet uniquement)
const PRIVATE = [
    [/^\/admin/, `Administration – ${SITE}`],
    [/^\/login/, `Connexion – ${SITE}`],
    [/^\/reset-password/, `Nouveau mot de passe – ${SITE}`],
];

// ---------------------------------------------------------------------------
// Précision par une page (ex. la boutique, selon la catégorie affichée)
// ---------------------------------------------------------------------------
const SeoContext = createContext({ override: null, setOverride: () => {} });

export function SeoProvider({ children }) {
    const [override, setOverride] = useState(null);
    return <SeoContext.Provider value={{ override, setOverride }}>{children}</SeoContext.Provider>;
}

/** Remplace le titre et la description par défaut tant que la page est affichée */
export function Seo({ title, description }) {
    const { setOverride } = useContext(SeoContext);
    useEffect(() => {
        setOverride({ title, description });
        return () => setOverride(null);
    }, [title, description, setOverride]);
    return null;
}

// ---------------------------------------------------------------------------
// Mise à jour de <head>
// ---------------------------------------------------------------------------
/** Met à jour (ou crée) une balise <meta> ou <link> identifiée par ses attributs */
function upsert(tag, keyAttrs, valueAttr, value) {
    const selector = tag + Object.entries(keyAttrs).map(([k, v]) => `[${k}="${v}"]`).join('');
    let el = document.head.querySelector(selector);
    if (!el) {
        el = document.createElement(tag);
        Object.entries(keyAttrs).forEach(([k, v]) => el.setAttribute(k, v));
        document.head.appendChild(el);
    }
    el.setAttribute(valueAttr, value);
}

export default function Canonical() {
    const { pathname, search } = useLocation();
    const { override } = useContext(SeoContext);

    // Politique sans slash final (sauf pour la racine)
    const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    // Boutique : chaque catégorie a sa propre adresse (?cat=…) ; le filtre de budget n'en crée pas.
    // (identifiants simples uniquement, écrits comme dans le sitemap : ?cat=projecteurs,lyres-scanners)
    const rawCat = path === '/shop' ? new URLSearchParams(search).get('cat') : null;
    const cat = rawCat && /^[a-z0-9,-]+$/.test(rawCat) ? rawCat : null;
    const href = `${BASE}${path}${cat ? `?cat=${cat}` : ''}`;

    const privateTitle = PRIVATE.find(([re]) => re.test(path))?.[1];
    const page = PAGES[path] || { title: privateTitle || SITE, description: DEFAULT_DESCRIPTION };
    const noindex = !!privateTitle || page.noindex || !PAGES[path];
    const title = override?.title || page.title;
    const description = override?.description || page.description;

    useEffect(() => {
        document.title = title;
        upsert('meta', { name: 'description' }, 'content', description);
        upsert('meta', { name: 'robots' }, 'content', noindex ? 'noindex,nofollow' : 'index,follow');
        upsert('link', { rel: 'canonical' }, 'href', href);
        upsert('meta', { property: 'og:title' }, 'content', title);
        upsert('meta', { property: 'og:description' }, 'content', description);
        upsert('meta', { property: 'og:url' }, 'content', href);
    }, [title, description, noindex, href]);

    return null;
}
