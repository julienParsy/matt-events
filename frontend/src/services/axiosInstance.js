// src/services/axiosInstance.js
import axios from 'axios';

// 1) Récup + assainissement (supprime "VITE_API_URL =" / espaces)
const rawEnv =
    (import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? '')
        .toString()
        .trim()
        // si quelqu'un a collé "VITE_API_URL = https://..." dans Vercel
        .replace(/^\s*VITE_API_URL\s*=\s*/i, '')
        .replace(/^\s*VITE_API_BASE_URL\s*=\s*/i, '')
        .trim();

// 2) Normalisation propre
function normalizeBase(apiRoot) {
    if (!apiRoot) return '';
    let u = apiRoot.trim();

    // supprime guillemets accidentels
    u = u.replace(/^['"]|['"]$/g, '');

    // si quelqu'un a mis un endpoint complet (…/api/xxx), on garde seulement la racine
    // -> on coupe après "/api"
    const apiIdx = u.indexOf('/api');
    if (apiIdx !== -1) u = u.slice(0, apiIdx + 4);

    // supprime les slashs finaux multiples
    u = u.replace(/\/+$/, '');

    // ajoute "/api" si absent
    if (!/\/api$/i.test(u)) u += '/api';

    // si pas de protocole, avertir (ça cassera en prod)
    if (!/^https?:\/\//i.test(u)) {
        console.error('[CONFIG] VITE_API_URL doit commencer par http(s):// — valeur actuelle:', u);
    }

    return u;
}

const baseURL = normalizeBase(rawEnv);

// 3) Aide au debug (une seule fois au boot)
if (!baseURL) {
    console.error('[CONFIG] VITE_API_URL/VITE_API_BASE_URL manquante. Définis-la dans Vercel (Production & Preview).');
} else {
    // n’affiche pas la valeur complète en prod si tu veux être discret
    console.log('[API] baseURL =', baseURL);
}

// 4) Création de l’instance
const axiosInstance = axios.create({
    baseURL,
    withCredentials: false, // passe à true si cookies HTTPOnly
});

// 5) JWT auto si présent
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// 6) Log des erreurs API (super utile en Preview)
axiosInstance.interceptors.response.use(
    (r) => r,
    (e) => {
        const s = e?.response?.status;
        const d = e?.response?.data || e.message;
        console.error('[API ERROR]', s, d);
        return Promise.reject(e);
    }
);

export default axiosInstance;
