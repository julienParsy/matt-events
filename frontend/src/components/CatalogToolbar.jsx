// src/components/CatalogToolbar.jsx
// Filtres du catalogue (boutique et admin) : onglets, sous-catégories de packs, recherche, tri, budget.
import { Search, X } from 'lucide-react';
import CategoryNav from './CategoryNav';
import SousCategoryNav from './SousCategoryNav';
import PriceFilter from './PriceFilter';
import styles from '../styles/components/CategoryList.module.css';

export default function CatalogToolbar({ categories, view }) {
    const {
        selectedCategory, setSelectedCategory,
        selectedSousCategory, setSelectedSousCategory,
        search, setSearch, sortByPrice, setSortByPrice,
        priceRange, setPriceRange,
        isPackView, sousCategoriesWithContent, viewItems,
    } = view;

    return (
        <>
            <CategoryNav
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
            />

            {isPackView && sousCategoriesWithContent.length > 0 && (
                <SousCategoryNav
                    sousCategories={sousCategoriesWithContent}
                    selectedSousCategory={selectedSousCategory}
                    onSelectSousCategory={setSelectedSousCategory}
                />
            )}

            <div className={styles.search}>
                <div className={styles.searchField}>
                    <Search className={styles.searchIcon} aria-hidden="true" />
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
                            <X size={16} aria-hidden="true" />
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
        </>
    );
}
