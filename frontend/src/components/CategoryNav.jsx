import React from 'react';
import PropTypes from 'prop-types';
import styles from '../styles/components/CategoryNav.module.css';

const PACKS_KEY = 'packs';

const categoryColors = [
    '#e74c3c', // rouge
    '#3498db', // bleu
    '#2ecc71', // vert
    '#f39c12', // orange
    '#9b59b6', // violet
    '#1abc9c'  // turquoise
];

const getCategoryColor = key => {
    const hash = typeof key === 'string' ? key.length : Number(key);
    return categoryColors[hash % categoryColors.length];
};

export default function CategoryNav({ categories = [], selectedCategory, onSelectCategory }) {
    const isAllActive = selectedCategory === null;
    const isPacksActive = selectedCategory === PACKS_KEY;

    return (
        <div className={styles.navCategory} role="toolbar" aria-label="Filtrer par catégorie">
            <button
                type="button"
                className={`${styles.btnSelectedCategory} ${isAllActive ? styles.active : ''}`}
                aria-pressed={isAllActive}
                onClick={() => onSelectCategory(null)}
                style={{ color: isAllActive ? '#ffffff' : undefined }}
            >
                Tous les produits
            </button>

            <button
                type="button"
                className={`${styles.btnSelectedCategory} ${isPacksActive ? styles.active : ''}`}
                aria-pressed={isPacksActive}
                onClick={() => onSelectCategory(PACKS_KEY)}
                style={{ color: isPacksActive ? getCategoryColor(PACKS_KEY) : undefined }}
            >
                Packs
            </button>

            {categories.map(cat => {
                const isActive = selectedCategory?.id === cat.id;
                const color = getCategoryColor(cat.id);

                return (
                    <button
                        key={cat.id}
                        type="button"
                        className={`${styles.btnSelectedCategory} ${isActive ? styles.active : ''}`}
                        aria-pressed={isActive}
                        onClick={() => onSelectCategory(cat)}
                        style={{ color: isActive ? color : undefined }}
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
        PropTypes.oneOf([PACKS_KEY])
    ]),
    onSelectCategory: PropTypes.func.isRequired
};
