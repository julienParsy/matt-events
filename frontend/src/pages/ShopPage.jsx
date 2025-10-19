// src/pages/ShopPage.jsx
import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import PackCard from '../components/PackCard';
import CategoryNav from '../components/CategoryNav';
import SousCategoryNav from '../components/SousCategoryNav';
import styles from '../styles/components/CategoryList.module.css';
import { fetchGroupedCatalog, fetchCategories } from '../data/api';
import axiosInstance from '../services/axiosInstance';

const PACKS_KEY = 'packs';

export default function ShopPage({ cart, setCart }) {
    const [catalog, setCatalog] = useState([]);
    const [packs, setPacks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sousCategories, setSousCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSousCategory, setSelectedSousCategory] = useState(null);
    const [search, setSearch] = useState('');
    const [sortByPrice, setSortByPrice] = useState(null);

    // --- Chargement initial ---
    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [catData, catalogData, packsRes, sousCatRes] = await Promise.all([
                fetchCategories(),
                fetchGroupedCatalog(),
                axiosInstance.get('/packs'),
                axiosInstance.get('/sous-categories')
            ]);
            setCategories(catData);
            setCatalog(catalogData);
            setPacks(packsRes.data);
            setSousCategories(sousCatRes.data);
        } catch (err) {
            console.error('Erreur chargement shop', err);
        }
    };

    // --- Ajout au panier ---
    const handleAddProduct = produit => {
        setCart(prev => {
            const existing = prev.find(item => item.id === produit.id && item.type !== 'pack');
            if (existing) {
                return prev.map(item =>
                    item.id === produit.id && item.type !== 'pack'
                        ? { ...item, quantite: item.quantite + 1 }
                        : item
                );
            }
            return [...prev, { ...produit, quantite: 1, type: 'produit' }];
        });
    };

    const handleAddPack = pack => {
        setCart(prev => {
            const existing = prev.find(item => item.id === pack.id && item.type === 'pack');
            if (existing) {
                return prev.map(item =>
                    item.id === pack.id && item.type === 'pack'
                        ? { ...item, quantite: item.quantite + 1 }
                        : item
                );
            }
            return [...prev, { ...pack, quantite: 1, type: 'pack' }];
        });
    };

    // --- Filtrage et tri ---
    const filterAndSortItems = items => {
        let filtered = items.filter(item =>
            item.nom.toLowerCase().includes(search.toLowerCase()) ||
            (item.modele?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
            (item.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
        );
        if (sortByPrice) {
            filtered = filtered.sort((a, b) =>
                sortByPrice === 'asc'
                    ? Number(a.prix) - Number(b.prix)
                    : Number(b.prix) - Number(a.prix)
            );
        }
        return filtered;
    };

    // --- Vue actuelle ---
    const isAllActive = selectedCategory === null;
    const isPackView = selectedCategory === PACKS_KEY;

    // --- Tous les produits à plat ---
    const allProducts = catalog.reduce((acc, group) => acc.concat(group.produits), []);
    const allItems = [
        ...allProducts.map(prod => ({ ...prod, _type: 'produit' })),
        ...packs.map(pack => ({ ...pack, _type: 'pack' }))
    ];
    const displayedAllItems = filterAndSortItems(allItems);

    // --- Packs filtrés par sous-catégorie ---
    const filteredPacks = selectedSousCategory
        ? packs.filter(p => Number(p.sous_categorie_id) === Number(selectedSousCategory.id))
        : packs;
    const displayedPacks = filterAndSortItems(filteredPacks.map(pack => ({ ...pack, _type: 'pack' })));

    // --- Sous-catégories à afficher seulement si elles contiennent des packs ---
    const sousCategoriesWithContent = sousCategories.filter(sc =>
        packs.some(pack => Number(pack.sous_categorie_id) === Number(sc.id))
    );

    // --- Produits filtrés par catégorie ---
    const groups = !isPackView && selectedCategory
        ? catalog.filter(g => g.id === selectedCategory.id)
        : catalog;

    const getDisplayedProductsFlat = produits =>
        filterAndSortItems(produits.map(prod => ({ ...prod, _type: 'produit' })));

    // --- Rendu ---
    return (
        <div className={styles.shopPage}>
            <div className="banner">
                <h1>Boutique</h1>
                <CategoryNav
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    className={styles.cat}
                />

                {/* Affiche la barre de sous-catégories uniquement si Packs est sélectionné */}
                {isPackView && (
                    <SousCategoryNav
                        sousCategories={sousCategoriesWithContent}
                        selectedSousCategory={selectedSousCategory}
                        onSelectSousCategory={setSelectedSousCategory}
                    />
                )}

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
            </div>

            {/* === Toutes les catégories (produits + packs) === */}
            {isAllActive && (
                <div className={styles.grid4}>
                    {displayedAllItems.length === 0 ? (
                        <p>Aucun article trouvé.</p>
                    ) : (
                        displayedAllItems.map(item =>
                            item._type === 'pack' ? (
                                <PackCard
                                    key={'pack-' + item.id}
                                    pack={item}
                                    onAddPack={handleAddPack}
                                    cart={cart}
                                />
                            ) : (
                                <ProductCard
                                    key={'prod-' + item.id}
                                    produit={item}
                                    cart={cart}
                                    onAdd={handleAddProduct}
                                />
                            )
                        )
                    )}
                </div>
            )}

            {/* === Vue Packs === */}
            {isPackView && (
                <div className={styles.grid4}>
                    {displayedPacks.length === 0 ? (
                        <p>Aucun pack trouvé.</p>
                    ) : (
                        displayedPacks.map(pack => (
                            <PackCard
                                key={pack.id}
                                pack={pack}
                                onAddPack={handleAddPack}
                                cart={cart}
                            />
                        ))
                    )}
                </div>
            )}

            {/* === Vue produits par catégorie === */}
            {!isAllActive && !isPackView && groups.map(group => {
                const displayedProducts = getDisplayedProductsFlat(group.produits);
                if (displayedProducts.length === 0) return null;
                return (
                    <div key={group.id}>
                        <div className={styles.grid4}>
                            {displayedProducts.map(prod => (
                                <ProductCard
                                    key={prod.id}
                                    produit={prod}
                                    cart={cart}
                                    onAdd={handleAddProduct}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
