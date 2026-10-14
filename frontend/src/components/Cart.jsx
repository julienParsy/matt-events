// src/components/Cart.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import CartTableItem from './Cart/CartTableItem';
import styles from '../styles/components/CartTable.module.css';
import { formatPrice, getCartTotals, getItemKey } from '../utils/cart';

const CATALOG_PATH = '/shop'; 

export default function Cart({ cart, onUpdate, onRemove }) {
    if (cart.length === 0) {
        return (
            <div className={styles.empty}>
                <p>Votre panier est vide.</p>
                <Link to={CATALOG_PATH} className={styles.emptyLink}>
                    Voir nos produits
                </Link>
            </div>
        );
    }

    const { price } = getCartTotals(cart);

    return (
        <div>
            <div className={styles.tableWrapper}>
                <table className={styles.cartTable}>
                    <caption className={styles.srOnly}>Articles de votre panier</caption>
                    <thead>
                        <tr>
                            <th scope="col">Article</th>
                            <th scope="col">Description</th>
                            <th scope="col">Quantité</th>
                            <th scope="col">Prix</th>
                            <th scope="col">Total</th>
                            <th scope="col">
                                <span className={styles.srOnly}>Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.map((item) => (
                            <CartTableItem
                                key={getItemKey(item)}
                                item={item}
                                onUpdate={onUpdate}
                                onRemove={onRemove}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={styles.totalCart}>Total : {formatPrice(price)}</div>
        </div>
    );
}

Cart.propTypes = {
    cart: PropTypes.array.isRequired,
    onUpdate: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
};