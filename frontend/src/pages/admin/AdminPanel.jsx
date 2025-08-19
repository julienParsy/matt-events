// src/pages/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import ProductCard from '../../components/ProductCard';
import ProductModal from '../../components/Modal/ProductModal';
import PackCard from '../../components/PackCard';
import PackModal from '../../components/Modal/PackModal';
import CategoryNav from '../../components/CategoryNav';
import NavAdmin from './NavAdmin';
import btnStyles from '../../styles/components/Button.module.css';
import styles from '../../styles/components/CategoryList.module.css';

import { fetchGroupedCatalog, fetchCategories } from '../../data/api';
import axiosInstance from '../../services/axiosInstance';

const PACKS_KEY = 'packs';

export default function AdminPanel() {
    const [groupedCatalog, setGroupedCatalog] = useState([]);
    const [packs, setPacks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Modal états (produit et pack)
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentProduct, setCurrentProduct] = useState(null);
    const [currentPack, setCurrentPack] = useState(null);

    // Recherche & tri
    const [search, setSearch] = useState('');
    const [sortByPrice, setSortByPrice] = useState(null); // 'asc' | 'desc' | null

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

    // --- LOGIQUE PRODUITS & PACKS ---
    const isAllActive = selectedCategory === null;
    const isPackView = selectedCategory === PACKS_KEY;
    // Groupes filtrés (vue catégorie)
    const filteredGroupedCatalog = !isPackView && selectedCategory
        ? groupedCatalog.filter(group => group.id === selectedCategory.id)
        : groupedCatalog;

    // Tous les produits à plat
    const allProducts = groupedCatalog.reduce(
        (acc, group) => acc.concat(group.produits),
        []
    );

    // Liste combinée produits + packs
    const allItems = [
        ...allProducts.map(prod => ({ ...prod, _type: 'produit' })),
        ...packs.map(pack => ({ ...pack, _type: 'pack' }))
    ];

    function filterAndSortItems(items) {
        let filtered = items.filter(item =>
            item.nom.toLowerCase().includes(search.toLowerCase()) ||
            (item.modele?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
            (item.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
        );
        if (sortByPrice) {
            filtered = [...filtered].sort((a, b) =>
                sortByPrice === 'asc'
                    ? Number(a.prix) - Number(b.prix)
                    : Number(b.prix) - Number(a.prix)
            );
        }
        return filtered;
    }

    // Pour la vue "toutes catégories" (mélangé packs et produits)
    const displayedAllItems = filterAndSortItems(allItems);
    // Pour la vue packs uniquement
    const displayedPacks = filterAndSortItems(
        packs.map(pack => ({ ...pack, _type: 'pack' }))
    );
    // Pour la vue produits par catégorie
    function getDisplayedProductsFlat(produits) {
        return filterAndSortItems(
            produits.map(prod => ({ ...prod, _type: 'produit' }))
        );
    }

    return (
        <div className={styles.adminPanel}>

            <div className='banner' >
            <h1>Gestion des produits & packs</h1>
                <NavAdmin />
                <hr />

            <CategoryNav
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
            />

            <div className={styles.search}>
                <select
                    className={styles.sortSelect}
                    value={sortByPrice || ''}
                    onChange={e => setSortByPrice(e.target.value || null)}
                >
                    <option value="">Trier par prix</option>
                    <option value="asc">Prix croissant</option>
                    <option value="desc">Prix décroissant</option>
                </select>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Rechercher un produit ou un pack..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                </div>
                <div className={`${btnStyles.divNouveauProduit}`}>
                    {!isPackView && (
                        <button
                            className={`${btnStyles.button} ${btnStyles.btnNew}`}
                            onClick={openAddProductModal}
                        >
                            Ajouter un produit
                        </button>
                    )}
                    {isPackView && (
                        <button
                            className={`${btnStyles.button} ${btnStyles.btnNew}`}
                            onClick={openAddPackModal}
                        >
                            Ajouter un pack
                        </button>

                    )}
                </div>

            </div>

            {isAllActive ? (
                <div className={styles.grid4}>
                    {displayedAllItems.length === 0 ? (
                        <p>Aucun article trouvé.</p>
                    ) : (
                        displayedAllItems.map(item =>
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
                                    categories={categories}
                                    onDelete={() => handleDeleteProduct(item.id)}
                                    onEdit={() => openEditProductModal(item)}
                                    onUpdate={refreshCatalog}
                                />
                            )
                        )
                    )}
                </div>
            ) : isPackView ? (
                <div className={styles.grid4}>
                    {displayedPacks.map(pack => (
                        <PackCard
                            key={pack.id}
                            pack={pack}
                            isAdmin
                            onEdit={() => openEditPackModal(pack)}
                            onDelete={() => handleDeletePack(pack.id)}
                        />
                    ))}
                </div>
            ) : (
                filteredGroupedCatalog.map(group => {
                    const displayedProducts = getDisplayedProductsFlat(group.produits);
                    if (displayedProducts.length === 0) return null;
                    return (
                        <div key={group.id}>
                            <div className={styles.grid4}>
                                {displayedProducts.map(prod => (
                                    <ProductCard
                                        key={prod.id}
                                        produit={prod}
                                        isAdmin
                                        categories={categories}
                                        onDelete={() => handleDeleteProduct(prod.id)}
                                        onEdit={() => openEditProductModal(prod)}
                                        onUpdate={refreshCatalog}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })
            )}

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
