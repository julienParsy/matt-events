import axios from 'axios';

// Racine d'API (ex: https://api.mattevents.fr ou https://<railway>.up.railway.app)
const API_ROOT =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL || ''; // compat si tu avais déjà cette var

// S'assure d'avoir .../api en baseURL, sans doublon
const baseURL = API_ROOT.endsWith('/api') ? API_ROOT : `${API_ROOT}/api`;

const axiosInstance = axios.create({
    baseURL,
    withCredentials: false, // passe à true si tu utilises des cookies d’auth
});

// Ajoute le token JWT à chaque requête si présent
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

export default axiosInstance;
