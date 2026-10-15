// src/components/PriceFilter.jsx
// Tranches de budget sous forme de pastilles, avec le nombre d'articles de la vue en cours.
import PropTypes from 'prop-types';
import { PRICE_RANGES, isInRange } from '../utils/priceRanges';
import styles from '../styles/components/CategoryNav.module.css';
import ScrollRow from './ScrollRow';

export default function PriceFilter({ items, selectedKey, onChange }) {
    return (
        <ScrollRow className={`${styles.navCategory} ${styles.price}`} role="toolbar" aria-label="Filtrer par budget">
            <span className={styles.priceLabel}>Budget</span>

            <button
                type="button"
                className={`${styles.pill} ${!selectedKey ? styles.active : ''}`}
                aria-pressed={!selectedKey}
                onClick={() => onChange(null)}
            >
                Tous les prix
            </button>

            {PRICE_RANGES.map(range => {
                const count = items.filter(item => isInRange(item, range)).length;
                const isActive = selectedKey === range.key;
                return (
                    <button
                        key={range.key}
                        type="button"
                        className={`${styles.pill} ${isActive ? styles.active : ''}`}
                        aria-pressed={isActive}
                        // Une tranche vide reste cliquable si elle est déjà choisie (pour pouvoir la retirer)
                        disabled={count === 0 && !isActive}
                        onClick={() => onChange(isActive ? null : range.key)}
                    >
                        {range.label}
                        <span className={styles.pillCount} aria-label={`${count} article${count > 1 ? 's' : ''}`}>{count}</span>
                    </button>
                );
            })}
        </ScrollRow>
    );
}

PriceFilter.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({ prix: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) })).isRequired,
    selectedKey: PropTypes.string,
    onChange: PropTypes.func.isRequired,
};
