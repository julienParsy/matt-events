import React from 'react';
import PropTypes from 'prop-types';
import styles from '../styles/components/CategoryNav.module.css';

const PACKS_KEY = 'packs';

// selectedCategory : null (tout), 'packs', une catégorie, ou un tableau de catégories
// (plusieurs onglets actifs, ex. « Éclairage » depuis l'accueil)
export default function CategoryNav({ categories = [], selectedCategory, onSelectCategory }) {
    const selectedList = Array.isArray(selectedCategory) ? selectedCategory : [];
    const isAllActive = selectedCategory === null || (Array.isArray(selectedCategory) && selectedList.length === 0);
    const isPacksActive = selectedCategory === PACKS_KEY;

    return (
        <div className={styles.navCategory} role="toolbar" aria-label="Filtrer par catégorie">
            <button
                type="button"
                className={`${styles.pill} ${isAllActive ? styles.active : ''}`}
                aria-pressed={isAllActive}
                onClick={() => onSelectCategory(null)}
            >
                Tous les produits
            </button>

            <button
                type="button"
                className={`${styles.pill} ${isPacksActive ? styles.active : ''}`}
                aria-pressed={isPacksActive}
                onClick={() => onSelectCategory(PACKS_KEY)}
            >
                Packs
            </button>

            {categories.map(cat => {
                const isActive = Array.isArray(selectedCategory)
                    ? selectedList.some(c => c.id === cat.id)
                    : selectedCategory?.id === cat.id;

                return (
                    <button
                        key={cat.id}
                        type="button"
                        className={`${styles.pill} ${isActive ? styles.active : ''}`}
                        aria-pressed={isActive}
                        onClick={() => onSelectCategory(cat)}
                    >
                        {cat.nom}
                    </button>
                );
            })}
        </div>
    );
}

CategoryNav.propTypes = {
    categories: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        nom: PropTypes.string.isRequired
    })),
    selectedCategory: PropTypes.oneOfType([
        PropTypes.shape({ id: PropTypes.number, nom: PropTypes.string }),
        PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, nom: PropTypes.string })),
        PropTypes.oneOf([PACKS_KEY])
    ]),
    onSelectCategory: PropTypes.func.isRequired
};