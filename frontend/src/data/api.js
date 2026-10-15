import axios from '../services/axiosInstance';

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

