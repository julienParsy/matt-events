import React from 'react';
import PropTypes from 'prop-types';
import styles from '../styles/components/CategoryNav.module.css';

const PACKS_KEY = 'packs';

export default function CategoryNav({ categories = [], selectedCategory, onSelectCategory }) {
    const isAllActive = selectedCategory === null;
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
                const isActive = selectedCategory?.id === cat.id;

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
        PropTypes.oneOf([PACKS_KEY])
    ]),
    onSelectCategory: PropTypes.func.isRequired
};