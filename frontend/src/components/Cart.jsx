import React from 'react';
import CartTableItem from './Cart/CartTableItem';
import styles from '../styles/components/CartTable.module.css';

export default function Cart({ cart, onUpdate, onRemove }) {
    const total = cart.reduce((sum, item) => sum + item.prix * item.quantite, 0);

    if (cart.length === 0) {
        return <p className={styles.empty}>Votre panier est vide.</p>;
    }

    return (
        <div>
        <div className={styles.tableWrapper}>
            <table className={styles.cartTable}>
                <thead>
                    <tr>
                        <th>Article</th>
                        <th>Description</th>
                        <th>Quantité</th>
                        <th>Prix</th>
                        <th>Total</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {cart.map(item => (
                        <CartTableItem
                            key={`${item.type}-${item.id}`}
                            item={item}
                            onUpdate={onUpdate}
                            onRemove={onRemove}
                        />
                    ))}
                </tbody>
            </table>
        </div >
            <div className={styles.totalCart}>
                Total : {total.toFixed(2)} €
            </div>
        </div>
    );
}
