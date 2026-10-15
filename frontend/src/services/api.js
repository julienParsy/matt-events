// @feature catalogue — Lecture du catalogue (catégories, produits groupés)
import axios from './axiosInstance';

export const fetchCategories = async () => {
    const response = await axios.get('/categories');
    return response.data;
};

export const fetchGroupedCatalog = async () => {
    const response = await axios.get('/products/grouped');
    return response.data;
};

