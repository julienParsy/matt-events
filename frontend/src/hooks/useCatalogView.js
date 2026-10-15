// @feature catalogue
// Logique commune à la boutique et à l'admin « Produits & packs » :
// onglet et budget lus dans l'adresse (?cat=…&prix=…), recherche, tri, et regroupement en sections.
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PACKS_KEY, slugify } from '../utils/categories';
import { findPriceRange, isInRange } from '../utils/priceRanges';

export default function useCatalogView({ categories, catalog, packs, sousCategories }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedSousCategory, setSelectedSousCategory] = useState(null);
    const [search, setSearch] = useState('');
    const [sortByPrice, setSortByPrice] = useState(null); // 'asc' | 'desc' | null

    // --- Onglet actif : ?cat=son, ?cat=projecteurs,lyres-scanners, ?cat=packs ---
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

    // --- Tranche de budget : ?prix=25-50, conservée en changeant d'onglet ---
    const priceRange = findPriceRange(searchParams.get('prix'));
    const setPriceRange = key => {
        const params = new URLSearchParams(searchParams);
        if (key) params.set('prix', key);
        else params.delete('prix');
        setSearchParams(params);
    };

    const isAllActive = selectedCategory === null;
    const isPackView = selectedCategory === PACKS_KEY;

    // --- Recherche + tri ---
    const q = search.trim().toLowerCase();
    const filterAndSort = items => {
        const filtered = items.filter(item =>
            !q ||
            item.nom.toLowerCase().includes(q) ||
            (item.modele?.toLowerCase().includes(q) ?? false) ||
            (item.description?.toLowerCase().includes(q) ?? false)
        );
        if (!sortByPrice) return filtered;
        return [...filtered].sort((a, b) =>
            sortByPrice === 'asc' ? Number(a.prix) - Number(b.prix) : Number(b.prix) - Number(a.prix)
        );
    };
    const asProducts = list => filterAndSort(list.map(prod => ({ ...prod, _type: 'produit' })));
    const asPacks = list => filterAndSort(list.map(pack => ({ ...pack, _type: 'pack' })));
    const packIn = sc => p => Number(p.sous_categorie_id) === Number(sc.id);

    // Sous-catégories proposées : seulement celles qui contiennent des packs
    const sousCategoriesWithContent = sousCategories.filter(sc => packs.some(packIn(sc)));

    // Packs regroupés par sous-catégorie (+ « Autres packs » pour ceux sans sous-catégorie)
    const packSections = (prefix = '') => [
        ...sousCategories.map(sc => ({ key: 'souscat-' + sc.id, title: prefix + sc.nom, items: asPacks(packs.filter(packIn(sc))) })),
        {
            key: 'souscat-autres',
            title: prefix ? prefix + 'Autres' : 'Autres packs',
            items: asPacks(packs.filter(p => !sousCategories.some(sc => packIn(sc)(p)))),
        },
    ];

    // --- Sections ---
    let sections;
    if (isPackView) {
        sections = selectedSousCategory
            ? [{ key: 'packs', title: selectedSousCategory.nom, items: asPacks(packs.filter(packIn(selectedSousCategory))) }]
            : packSections();
    } else {
        const selectedIds = Array.isArray(selectedCategory)
            ? selectedCategory.map(c => c.id)
            : selectedCategory ? [selectedCategory.id] : [];
        const groups = selectedIds.length ? catalog.filter(g => selectedIds.includes(g.id)) : catalog;
        sections = groups.map(group => ({ key: 'cat-' + group.id, title: group.nom, items: asProducts(group.produits) }));
        if (isAllActive) sections.push(...packSections('Packs – '));
    }

    // Budget appliqué en dernier : les compteurs du filtre portent sur la vue avant ce filtre
    const viewItems = sections.flatMap(section => section.items);
    if (priceRange) {
        sections = sections.map(section => ({ ...section, items: section.items.filter(item => isInRange(item, priceRange)) }));
    }
    const visibleSections = sections.filter(section => section.items.length > 0);

    return {
        selectedCategory, setSelectedCategory,
        selectedSousCategory, setSelectedSousCategory,
        priceRange, setPriceRange,
        search, setSearch,
        sortByPrice, setSortByPrice,
        isAllActive, isPackView,
        sousCategoriesWithContent,
        viewItems,
        visibleSections,
        showSectionTitles: visibleSections.length > 1,
    };
}
