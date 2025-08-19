// src/components/Cart/CartTableItem.jsx
import React from 'react';
import PropTypes from 'prop-types';

export default function CartTableItem({ item, onUpdate, onRemove }) {
    const total = (item.prix * item.quantite).toFixed(2);

    return (
        <tr>
            <td>{item.nom}</td>
            <td>{item.modele || item.description || '-'}</td>
            <td>
                <button onClick={() => onUpdate(item.id, item.quantite - 1, item.stock)} disabled={item.quantite <= 1}
                    aria-label="Enlever"
                >
                    −</button>
                <input
                    type="number"
                    min="1"
                    max={item.stock}
                    value={item.quantite}
                    onChange={e => {
                        const value = parseInt(e.target.value, 10);
                        if (!isNaN(value)) onUpdate(item.id, value, item.stock);
                    }}
                />
                <button onClick={() => onUpdate(item.id, item.quantite + 1, item.stock)} disabled={item.quantite >= item.stock}
                    aria-label="Ajouter"
                >
                    +
                </button>
            </td>
            <td>{item.prix} €</td>
            <td>{total} €</td>
            <td>
                <button onClick={() => onRemove(item.id)}>🗑️</button>
            </td>
        </tr>
    );
}

CartTableItem.propTypes = {
    item: PropTypes.object.isRequired,
    onUpdate: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired
};
