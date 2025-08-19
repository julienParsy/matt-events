// src/pages/ShopPage.jsx
import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import PackCard from '../components/PackCard';
import CategoryNav from '../components/CategoryNav';
import styles from '../styles/components/CategoryList.module.css';

import { fetchGroupedCatalog, fetchCategories } from '../data/api';
import axiosInstance from '../services/axiosInstance';

const PACKS_KEY = 'packs';

export default function ShopPage({ cart, setCart }) {
    const [catalog, setCatalog] = useState([]);
    const [packs, setPacks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [search, setSearch] = useState('');
    const [sortByPrice, setSortByPrice] = useState(null); // 'asc' | 'desc' | null

    // Au montage, charge tout
    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const catData = await fetchCategories();
            setCategories(catData);
            const catalogData = await fetchGroupedCatalog();
            setCatalog(catalogData);

            const res = await axiosInstance.get('/packs');
            setPacks(res.data);
        } catch (err) {
            console.error('Erreur chargement shop', err);
        }
    };

    // Ajout produit panier
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

    // Ajout pack panier
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

    // --- LOGIQUE PRODUITS ET PACKS ---
    // Vue "packs" (bouton "Packs" actif)
    const isPackView = selectedCategory === PACKS_KEY;
    // Vue "toutes les catégories"
    const isAllActive = selectedCategory === null;
    // Groupes filtrés (vue catégorie)
    const groups = !isPackView && selectedCategory
        ? catalog.filter(g => g.id === selectedCategory.id)
        : catalog;

    // Tous les produits à plat
    const allProducts = catalog.reduce(
        (acc, group) => acc.concat(group.produits),
        []
    );

    // Combine produits + packs pour la vue "Toutes les catégories"
    const allItems = [
        ...allProducts.map(prod => ({ ...prod, _type: 'produit' })),
        ...packs.map(pack => ({ ...pack, _type: 'pack' }))
    ];

    // Fonction générique pour recherche et tri
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
        <div className={styles.shopPage}>
            <div className="banner">
            <h1 >
                Boutique
            </h1>
            <CategoryNav
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                className={styles.cat}
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
            ) : isPackView ? (
                <div>
                    <div className={styles.grid4}>
                        {displayedPacks.map(pack => (
                            <PackCard
                                key={pack.id}
                                pack={pack}
                                onAddPack={handleAddPack}
                                cart={cart}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                groups.map(group => {
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
                })
            )}

        </div>
    );
}
