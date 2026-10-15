// src/pages/ShopPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import PackCard from '../components/PackCard';
import CategoryNav from '../components/CategoryNav';
import SousCategoryNav from '../components/SousCategoryNav';
import styles from '../styles/components/CategoryList.module.css';
import { fetchGroupedCatalog, fetchCategories } from '../data/api';
import axiosInstance from '../services/axiosInstance';
import { PACKS_KEY, slugify } from '../utils/categories';
import { findPriceRange, isInRange } from '../utils/priceRanges';
import PriceFilter from '../components/PriceFilter';

export default function ShopPage({ cart, setCart }) {
    const [catalog, setCatalog] = useState([]);
    const [packs, setPacks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sousCategories, setSousCategories] = useState([]);
    const [selectedSousCategory, setSelectedSousCategory] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // --- Onglet actif : lu dans l'adresse (/shop?cat=son, ?cat=projecteurs,lyres-scanners, ?cat=packs) ---
    const catParam = searchParams.get('cat') || '';
    const selectedCategory = useMemo(() => {
        if (!catParam) return null;
        if (catParam === PACKS_KEY) return PACKS_KEY;
        const slugs = catParam.split(',');
        const matched = categories.filter(c => slugs.includes(slugify(c.nom)));
        if (matched.length === 0) return null; // catégorie inconnue (ou pas encore chargée) : tout afficher
        return matched.length === 1 ? matched[0] : matched;
    }, [catParam, categories]);

    // Clic sur un onglet : l'adresse change (lien partageable, bouton « Retour » du navigateur)
    const setSelectedCategory = value => {
        const params = new URLSearchParams(searchParams);
        if (value === null) params.delete('cat');
        else if (value === PACKS_KEY) params.set('cat', PACKS_KEY);
        else params.set('cat', slugify(value.nom));
        setSearchParams(params);
        setSelectedSousCategory(null);
    };

    // --- Tranche de budget : aussi dans l'adresse (/shop?prix=25-50), conservée en changeant d'onglet ---
    const priceRange = findPriceRange(searchParams.get('prix'));
    const setPriceRange = key => {
        const params = new URLSearchParams(searchParams);
        if (key) params.set('prix', key);
        else params.delete('prix');
        setSearchParams(params);
    };
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
    const selectedIds = Array.isArray(selectedCategory)
        ? selectedCategory.map(c => c.id)
        : selectedCategory && !isPackView ? [selectedCategory.id] : [];
    const groups = selectedIds.length
        ? catalog.filter(g => selectedIds.includes(g.id))
        : catalog;

    const getDisplayedProductsFlat = produits =>
        filterAndSortItems(produits.map(prod => ({ ...prod, _type: 'produit' })));

    // --- Sections affichées ---
    const asProducts = produits => getDisplayedProductsFlat(produits);
    const asPacks = list => filterAndSortItems(list.map(pack => ({ ...pack, _type: 'pack' })));

    // Packs regroupés par sous-catégorie (ceux sans sous-catégorie à la fin)
    const packSections = list => [
        ...sousCategories.map(sc => ({
            key: 'souscat-' + sc.id,
            title: sc.nom,
            items: asPacks(list.filter(p => Number(p.sous_categorie_id) === Number(sc.id))),
        })),
        {
            key: 'souscat-autres',
            title: 'Autres packs',
            items: asPacks(list.filter(p => !sousCategories.some(sc => Number(sc.id) === Number(p.sous_categorie_id)))),
        },
    ];

    let sections;
    if (isPackView) {
        sections = selectedSousCategory
            ? [{ key: 'packs', title: selectedSousCategory.nom, items: displayedPacks }]
            : packSections(packs);
    } else {
        sections = groups.map(group => ({ key: 'cat-' + group.id, title: group.nom, items: asProducts(group.produits) }));
        if (isAllActive) sections.push({ key: 'packs', title: 'Packs', items: asPacks(packs) });
    }

    // Tranche de budget : appliquée en dernier, les compteurs portent sur la vue avant ce filtre
    const viewItems = sections.flatMap(section => section.items);
    if (priceRange) {
        sections = sections.map(section => ({ ...section, items: section.items.filter(item => isInRange(item, priceRange)) }));
    }
    const visibleSections = sections.filter(section => section.items.length > 0);
    const showSectionTitles = visibleSections.length > 1;

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
                    <div className={styles.searchField}>
                        <svg
                            className={styles.searchIcon}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                            focusable="false"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            className={styles.searchInput}
                            type="search"
                            placeholder="Rechercher un produit ou un pack…"
                            aria-label="Rechercher un produit ou un pack"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                type="button"
                                className={styles.searchClear}
                                aria-label="Effacer la recherche"
                                onClick={() => setSearch('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <select
                        className={styles.sortSelect}
                        aria-label="Trier par prix"
                        value={sortByPrice || ''}
                        onChange={e => setSortByPrice(e.target.value || null)}
                    >
                        <option value="">Trier par prix</option>
                        <option value="asc">Prix croissant</option>
                        <option value="desc">Prix décroissant</option>
                    </select>
                </div>

                <PriceFilter items={viewItems} selectedKey={priceRange?.key ?? null} onChange={setPriceRange} />
            </div>

            {/* === Articles, regroupés par section (titres affichés s'il y a plusieurs sections) === */}
            {visibleSections.length === 0 ? (
                <div className={styles.emptyShop}>
                    {priceRange && viewItems.length > 0 ? (
                        <>
                            <p>Aucun article dans la tranche « {priceRange.label} ».</p>
                            <button type="button" className={styles.emptyReset} onClick={() => setPriceRange(null)}>
                                Voir tous les prix
                            </button>
                        </>
                    ) : (
                        <p>{isPackView ? 'Aucun pack trouvé.' : 'Aucun article trouvé.'}</p>
                    )}
                </div>
            ) : (
                visibleSections.map(section => (
                    <section
                        key={section.key}
                        className={styles.shopSection}
                        aria-labelledby={showSectionTitles ? `section-${section.key}` : undefined}
                    >
                        {showSectionTitles && (
                            <header className={styles.sectionHeader}>
                                <h2 id={`section-${section.key}`} className={styles.sectionTitle}>{section.title}</h2>
                                <span className={styles.sectionCount}>
                                    {section.items.length} article{section.items.length > 1 ? 's' : ''}
                                </span>
                            </header>
                        )}
                        <div className={styles.grid4}>
                            {section.items.map(item =>
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
                            )}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
}