// @feature catalogue — Boutique
import React, { useEffect, useState } from 'react';
import ProductCard from '../components/catalog/ProductCard';
import PackCard from '../components/catalog/PackCard';
import CatalogToolbar from '../components/catalog/CatalogToolbar';
import CatalogSections from '../components/catalog/CatalogSections';
import useCatalogView from '../hooks/useCatalogView';
import { Seo } from '../components/layout/Seo';
import { PACKS_KEY } from '../utils/categories';
import styles from '../styles/components/CategoryList.module.css';
import { fetchGroupedCatalog, fetchCategories } from '../services/api';
import axiosInstance from '../services/axiosInstance';

export default function ShopPage({ cart, setCart }) {
    const [catalog, setCatalog] = useState([]);
    const [packs, setPacks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sousCategories, setSousCategories] = useState([]);

    // Onglet, budget (dans l'adresse), recherche, tri et sections : logique partagée avec l'admin
    const view = useCatalogView({ categories, catalog, packs, sousCategories });

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

    // Titre de la page selon la ou les catégories affichées (référencement et onglet du navigateur)
    const selected = view.selectedCategory;
    let seo = null;
    if (selected === PACKS_KEY) {
        seo = {
            title: "Packs son et lumière clé en main – Matt'events",
            description: "Packs prêts à l'emploi pour vos soirées, mariages et événements : sonorisation, lumière, vidéo.",
        };
    } else if (selected) {
        const noms = [].concat(selected).map(c => c.nom).join(', ');
        seo = {
            title: `${noms} : location – Matt'events`,
            description: `Location ${noms.toLowerCase()} pour vos événements, près de Lille. Composez votre demande en ligne.`,
        };
    }

    // --- Rendu ---
    return (
        <div className={styles.shopPage}>
            {seo && <Seo title={seo.title} description={seo.description} />}
            <div className="banner">
                <h1>Boutique</h1>
                <CatalogToolbar categories={categories} view={view} />
            </div>

            <CatalogSections
                view={view}
                renderItem={item =>
                    item._type === 'pack' ? (
                        <PackCard key={'pack-' + item.id} pack={item} onAddPack={handleAddPack} cart={cart} />
                    ) : (
                        <ProductCard key={'prod-' + item.id} produit={item} cart={cart} onAdd={handleAddProduct} />
                    )
                }
            />
        </div>
    );
}
