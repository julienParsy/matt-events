// src/components/Cart/CartTableItem.jsx
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/components/CartTable.module.css';
import { formatPrice } from '../../utils/cart';
import { MinusIcon, PlusIcon, TrashIcon } from './icons';

export default function CartTableItem({ item, onUpdate, onRemove }) {
    const { nom, quantite, stock, prix } = item;
    const maxReached = Number.isFinite(stock) && quantite >= stock;

    // Valeur en cours de saisie : permet d'effacer le champ et de retaper
    // sans que la quantité soit imposée à chaque frappe.
    const [draft, setDraft] = useState(String(quantite));
    useEffect(() => setDraft(String(quantite)), [quantite]);

    const commitDraft = () => {
        const value = parseInt(draft, 10);
        if (Number.isNaN(value)) {
            setDraft(String(quantite));
            return;
        }
        onUpdate(item, value); // le parent borne entre 1 et le stock
        setDraft(String(Math.min(Math.max(value, 1), Number.isFinite(stock) ? stock : value)));
    };

    return (
        <tr>
            <td data-label="Article">
                <div className={styles.product}>
                    {item.image && (
                        <img src={item.image} alt="" className={styles.thumb} loading="lazy" />
                    )}
                    <span>{nom}</span>
                </div>
            </td>
            <td data-label="Description">{item.modele || item.description || '-'}</td>
            <td data-label="Quantité">
                <div className={styles.qty} role="group" aria-label={`Quantité de ${nom}`}>
                    <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => onUpdate(item, quantite - 1)}
                        disabled={quantite <= 1}
                        aria-label={`Retirer une unité de ${nom}`}
                    >
                        <MinusIcon />
                    </button>
                    <input
                        type="number"
                        inputMode="numeric"
                        className={styles.qtyInput}
                        min="1"
                        max={stock}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onBlur={commitDraft}
                        onKeyDown={(e) => e.key === 'Enter' && commitDraft()}
                        aria-label="Quantité"
                    />
                    <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => onUpdate(item, quantite + 1)}
                        disabled={maxReached}
                        aria-label={`Ajouter une unité de ${nom}`}
                        title={maxReached ? `Stock maximum : ${stock}` : undefined}
                    >
                        <PlusIcon />
                    </button>
                </div>
                {maxReached && <p className={styles.stockHint}>Stock max : {stock}</p>}
            </td>
            <td data-label="Prix">{formatPrice(prix)}</td>
            <td data-label="Total">{formatPrice(prix * quantite)}</td>
            <td className={styles.actions}>
                <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => onRemove(item)}
                    aria-label={`Supprimer ${nom} du panier`}
                >
                    <TrashIcon />
                </button>
            </td>
        </tr>
    );
}

CartTableItem.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        type: PropTypes.string,
        nom: PropTypes.string.isRequired,
        modele: PropTypes.string,
        description: PropTypes.string,
        image: PropTypes.string,
        prix: PropTypes.number.isRequired,
        quantite: PropTypes.number.isRequired,
        stock: PropTypes.number,
    }).isRequired,
    onUpdate: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
};