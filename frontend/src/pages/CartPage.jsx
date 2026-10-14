// src/pages/CartPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Cart from '../components/Cart';
import RequestModal from '../components/Cart/RequestModal';
import styles from '../styles/components/Cart.module.css';
import { clampQuantity, getCartTotals, getItemKey } from '../utils/cart';

const UNDO_DELAY_MS = 6000;

export default function CartPage({ cart, setCart }) {
    const [showModal, setShowModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [lastRemoved, setLastRemoved] = useState(null); // { item, index }

    const { count: totalCount } = useMemo(() => getCartTotals(cart), [cart]);

    // Le bandeau « Annuler » disparaît tout seul.
    useEffect(() => {
        if (!lastRemoved) return undefined;
        const timer = setTimeout(() => setLastRemoved(null), UNDO_DELAY_MS);
        return () => clearTimeout(timer);
    }, [lastRemoved]);

    const handleUpdate = (item, newQty) => {
        const quantite = clampQuantity(newQty, item.stock);
        const key = getItemKey(item);
        setCart((prev) => prev.map((i) => (getItemKey(i) === key ? { ...i, quantite } : i)));
    };

    const handleRemove = (item) => {
        const key = getItemKey(item);
        setLastRemoved({ item, index: cart.findIndex((i) => getItemKey(i) === key) });
        setCart((prev) => prev.filter((i) => getItemKey(i) !== key));
    };

    const handleUndo = () => {
        if (!lastRemoved) return;
        const { item, index } = lastRemoved;
        setCart((prev) => {
            if (prev.some((i) => getItemKey(i) === getItemKey(item))) return prev;
            const next = [...prev];
            next.splice(Math.min(index, next.length), 0, item);
            return next;
        });
        setLastRemoved(null);
    };

    const handleRequestSent = () => {
        setShowModal(false);
        setCart([]);
        setLastRemoved(null);
        setSuccessMessage(
            'Votre demande a bien été envoyée ! 🎉 Nous répondrons dans les meilleurs délais.'
        );
    };

    return (
        <div>
            <h1 className="banner">Votre Panier</h1>

            {successMessage && (
                <p role="status" className={styles.successMessage}>
                    {successMessage}
                </p>
            )}

            <Cart cart={cart} onUpdate={handleUpdate} onRemove={handleRemove} />

            <div role="status" className={styles.undoZone}>
                {lastRemoved && (
                    <p className={styles.undoToast}>
                        « {lastRemoved.item.nom} » retiré du panier.
                        <button type="button" className={styles.undoBtn} onClick={handleUndo}>
                            Annuler
                        </button>
                    </p>
                )}
            </div>

            {cart.length > 0 && (
                <div className={styles.divDemande}>
                    <p className={styles.totalText}>
                        Total d’articles : <strong>{totalCount}</strong>
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setSuccessMessage('');
                            setShowModal(true);
                        }}
                        className={styles.btnEmail}
                    >
                        Faire une demande
                    </button>
                </div>
            )}

            {showModal && (
                <RequestModal
                    cart={cart}
                    totalCount={totalCount}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleRequestSent}
                />
            )}
        </div>
    );
}

CartPage.propTypes = {
    cart: PropTypes.array.isRequired,
    setCart: PropTypes.func.isRequired,
};