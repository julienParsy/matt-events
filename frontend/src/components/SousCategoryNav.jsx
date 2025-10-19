import React from 'react';
import PropTypes from 'prop-types';
import styles from '../styles/components/CategoryNav.module.css';

const SOUS_PACKS_KEY = 'sous_packs';

const sousCategoryColors = [
    '#e67e22', // orange foncé
    '#16a085', // vert émeraude
    '#8e44ad', // violet profond
    '#2980b9', // bleu
    '#c0392b', // rouge foncé
    '#27ae60'  // vert clair
];

const getSousCategoryColor = key => {
    const hash = typeof key === 'string' ? key.length : Number(key);
    return sousCategoryColors[hash % sousCategoryColors.length];
};

export default function SousCategoryNav({ sousCategories = [], selectedSousCategory, onSelectSousCategory }) {
    const isAllActive = selectedSousCategory === null;

    return (
        <div className={styles.navCategory} role="toolbar" aria-label="Filtrer par sous-catégorie">
            <button
                type="button"
                className={`${styles.btnSelectedCategory} ${isAllActive ? styles.active : ''}`}
                aria-pressed={isAllActive}
                onClick={() => onSelectSousCategory(null)}
                style={{ color: isAllActive ? '#ffffff' : undefined }}
            >
                Tous les packs
            </button>

            {sousCategories.map(sc => {
                const isActive = selectedSousCategory?.id === sc.id;
                const color = getSousCategoryColor(sc.id);

                return (
                    <button
                        key={sc.id}
                        type="button"
                        className={`${styles.btnSelectedCategory} ${isActive ? styles.active : ''}`}
                        aria-pressed={isActive}
                        onClick={() => onSelectSousCategory(sc)}
                        style={{ color: isActive ? color : undefined }}
                    >
                        {sc.nom}
                    </button>
                );
            })}
        </div>
    );
}

SousCategoryNav.propTypes = {
    sousCategories: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        nom: PropTypes.string.isRequired
    })),
    selectedSousCategory: PropTypes.oneOfType([
        PropTypes.shape({ id: PropTypes.number, nom: PropTypes.string }),
        PropTypes.oneOf([SOUS_PACKS_KEY])
    ]),
    onSelectSousCategory: PropTypes.func.isRequired
};
