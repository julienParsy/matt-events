import React from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/components/CategoryNav.module.css';
import ScrollRow from '../ui/ScrollRow';

const SOUS_PACKS_KEY = 'sous_packs';

export default function SousCategoryNav({ sousCategories = [], selectedSousCategory, onSelectSousCategory }) {
    const isAllActive = selectedSousCategory === null;

    return (
        <ScrollRow
            className={`${styles.navCategory} ${styles.sub}`}
            role="toolbar"
            aria-label="Filtrer par sous-catégorie"
        >
            <button
                type="button"
                className={`${styles.pill} ${isAllActive ? styles.active : ''}`}
                aria-pressed={isAllActive}
                onClick={() => onSelectSousCategory(null)}
            >
                Tous les packs
            </button>

            {sousCategories.map(sc => {
                const isActive = selectedSousCategory?.id === sc.id;

                return (
                    <button
                        key={sc.id}
                        type="button"
                        className={`${styles.pill} ${isActive ? styles.active : ''}`}
                        aria-pressed={isActive}
                        onClick={() => onSelectSousCategory(sc)}
                    >
                        {sc.nom}
                    </button>
                );
            })}
        </ScrollRow>
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