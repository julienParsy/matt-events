import axios from '../services/axiosInstance';

// Récupère tous les produits (non groupés)
export const fetchCatalog = async () => {
    const response = await axios.get('/products');
    return response.data;
};

// Récupère toutes les catégories
export const fetchCategories = async () => {
    const response = await axios.get('/categories');
    return response.data;
};

// ✅ Récupère les produits groupés par catégorie
export const fetchGroupedCatalog = async () => {
    const response = await axios.get('/products/grouped');
    return response.data;
};

export const fetchProductsPaginated = async (page = 1, limit = 12) => {
    const res = await axios.get(`/products?page=${page}&limit=${limit}`);
    return res.data;
};

