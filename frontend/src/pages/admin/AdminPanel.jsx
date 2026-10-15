// src/pages/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import ProductCard from '../../components/ProductCard';
import ProductModal from '../../components/Modal/ProductModal';
import PackCard from '../../components/PackCard';
import PackModal from '../../components/Modal/PackModal';
import CatalogToolbar from '../../components/CatalogToolbar';
import CatalogSections from '../../components/CatalogSections';
import useCatalogView from '../../hooks/useCatalogView';
import { Package, Plus } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import ui from '../../styles/components/AdminUI.module.css';
import styles from '../../styles/components/CategoryList.module.css';

import { fetchGroupedCatalog, fetchCategories } from '../../data/api';
import axiosInstance from '../../services/axiosInstance';


export default function AdminPanel() {
    const [groupedCatalog, setGroupedCatalog] = useState([]);
    const [packs, setPacks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sousCategories, setSousCategories] = useState([]);

    // Modal états (produit et pack)
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentProduct, setCurrentProduct] = useState(null);
    const [currentPack, setCurrentPack] = useState(null);

    // Onglet, budget (dans l'adresse), recherche, tri et sections : même logique que la boutique
    const view = useCatalogView({ categories, catalog: groupedCatalog, packs, sousCategories });
    const { isPackView } = view;

    // Chargement initial
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        refreshCatalog();
        fetchAllPacks();
        fetchCategories()
            .then(setCategories)
            .catch(err => console.error('❌ Erreur chargement catégories :', err));

    }, []);

    useEffect(() => {
        axiosInstance.get('/sous-categories')
            .then(res => setSousCategories(res.data))
            .catch(err => console.error('❌ Erreur chargement sous-catégories :', err));
    }, []);

    const refreshCatalog = async () => {
        try {
            const data = await fetchGroupedCatalog();
            setGroupedCatalog(data);
        } catch (err) {
            console.error('❌ Erreur chargement catalogue groupé :', err);
        }
    };

    const fetchAllPacks = async () => {
        try {
            const res = await axiosInstance.get('/packs');
            setPacks(res.data);
        } catch (err) {
            console.error('❌ Erreur chargement packs :', err);
        }
    };

    // --- PRODUIT ---
    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Supprimer ce produit ?')) return;
        try {
            await axiosInstance.delete(`/products/${id}`);
            refreshCatalog();
        } catch (err) {
            console.error('❌ Erreur suppression produit :', err);
            alert('Erreur lors de la suppression');
        }
    };
    const openAddProductModal = () => {
        setModalMode('add');
        setCurrentProduct(null);
        setModalOpen('product');
    };
    const openEditProductModal = (product) => {
        setModalMode('edit');
        setCurrentProduct(product);
        setModalOpen('product');
    };

    // --- PACK ---
    const handleDeletePack = async (id) => {
        if (!window.confirm('Supprimer ce pack ?')) return;
        try {
            await axiosInstance.delete(`/packs/${id}`);
            fetchAllPacks();
        } catch (err) {
            console.error('❌ Erreur suppression pack :', err);
            alert('Erreur lors de la suppression');
        }
    };
    const openAddPackModal = () => {
        setModalMode('add');
        setCurrentPack(null);
        setModalOpen('pack');
    };
    const openEditPackModal = (pack) => {
        setModalMode('edit');
        setCurrentPack(pack);
        setModalOpen('pack');
    };

    const productCount = groupedCatalog.reduce((n, group) => n + group.produits.length, 0);

    return (
        <div className={styles.adminPanel}>

            <AdminHeader
                icon={Package}
                title="Produits & packs"
                subtitle={`${productCount} produit${productCount > 1 ? 's' : ''} · ${packs.length} pack${packs.length > 1 ? 's' : ''}`}
                actions={
                    <button
                        type="button"
                        className={`${ui.btn} ${ui.btnPrimary}`}
                        onClick={isPackView ? openAddPackModal : openAddProductModal}
                    >
                        <Plus size={18} aria-hidden="true" />
                        {isPackView ? 'Nouveau pack' : 'Nouveau produit'}
                    </button>
                }
            >
                <CatalogToolbar categories={categories} view={view} />
            </AdminHeader>

            <CatalogSections
                view={view}
                renderItem={item =>
                    item._type === 'pack' ? (
                        <PackCard
                            key={'pack-' + item.id}
                            pack={item}
                            isAdmin
                            onEdit={() => openEditPackModal(item)}
                            onDelete={() => handleDeletePack(item.id)}
                        />
                    ) : (
                        <ProductCard
                            key={'prod-' + item.id}
                            produit={item}
                            isAdmin
                            onDelete={() => handleDeleteProduct(item.id)}
                            onEdit={() => openEditProductModal(item)}
                        />
                    )
                }
            />

            {/* MODALE PRODUIT */}
            {modalOpen === 'product' && (
                <ProductModal
                    isOpen={!!modalOpen}
                    mode={modalMode}
                    product={currentProduct}
                    onClose={() => setModalOpen(false)}
                    onSuccess={() => {
                        setModalOpen(false);
                        refreshCatalog();
                    }}
                />
            )}

            {/* MODALE PACK */}
            {modalOpen === 'pack' && (
                <PackModal
                    isOpen={!!modalOpen}
                    mode={modalMode}
                    pack={currentPack}
                    onClose={() => setModalOpen(false)}
                    onSuccess={() => {
                        setModalOpen(false);
                        fetchAllPacks();
                    }}
                />
            )}
        </div>
    );
}
