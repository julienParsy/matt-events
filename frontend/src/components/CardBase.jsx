// src/components/CardBase.jsx
import React, { useState } from 'react';
import btnStyles from '../styles/components/Button.module.css';
import cardStyles from '../styles/components/Card.module.css';

export default function CardBase({
    item,                // objet : produit ou pack
    isPack = false,      // permet de customiser certains labels
    cart = [],
    isAdmin = false,
    onAdd,
    onDelete,
    onEdit,
    onUpdate,
    OverlayComponent,    // composant overlay (ProductOverlay/PackOverlay...)
    ModalComponent,      // composant modal édition (ProductModal/PackModal...)
    modalMode = 'edit',
}) {
    const [showModal, setShowModal] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);

    // Stock, description, vidéo, etc.
    const stock = parseInt(item.stock, 10) || 0;
    const itemInCart = cart.find(p => p.id === item.id);
    const quantityInCart = itemInCart?.quantite || 0;
    const isOutOfStock = quantityInCart >= stock || stock <= 0;
    const hasContent = !!item.description || !!item.video_url;
    if (!item) return <div className={cardStyles.card}>Données manquantes.</div>;


    return (
        <div className={cardStyles.card}>
            {(item.image || item.image_url) && (
                <img
                    src={item.image || item.image_url}
                    onError={e => (e.target.src = '/no-image.png')}
                    alt={item.nom}
                    className={cardStyles.productImage}
                    loading="lazy"
                />
            )}

            <h3 className={cardStyles.nom}>{item.nom}</h3>
            {/* Pour les packs : description courte visible */}
            {isPack && <p className={cardStyles.description}>{item.description}</p>}
            {!isPack && <p className={cardStyles.modele}>{item.modele}</p>}
            <p className={cardStyles.prix}>{item.prix} €</p>
            <p className={cardStyles.stock}>
                Quantité disponible : {stock - quantityInCart}
            </p>

            {/* Bouton pour voir les détails (overlay) */}
            {OverlayComponent && (
                <div className={btnStyles.btnVoirContainer}>
                    <button
                        onClick={() => hasContent && setShowOverlay(true)}
                        disabled={!hasContent}
                        className={btnStyles.btnVoir}
                        aria-label="Voir détails"
                    >
                        Voir +
                    </button>
                </div>
            )}

            {showOverlay && OverlayComponent && (
                <OverlayComponent
                    produit={item}
                    onClose={() => setShowOverlay(false)}
                />
            )}

            {/* Bouton ajout panier */}
            {!isAdmin && onAdd && (
                <button
                    onClick={e => { e.stopPropagation(); onAdd(item); }}
                    disabled={isOutOfStock}
                    className={`${btnStyles.button} ${btnStyles.btnAjouter}`}
                >
                    {isOutOfStock
                        ? (isPack ? 'Indisponible' : 'Indisponible')
                        : isPack ? 'Ajouter le pack' : 'Ajouter au panier'}
                </button>
            )}

            {/* Actions admin */}
            {isAdmin && (
                <div className={btnStyles.btnCardAdmin}>
                    {onDelete && (
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                if (window.confirm('Confirmer la suppression ?')) {
                                    onDelete(item.id);
                                    alert(isPack ? 'Pack supprimé !' : 'Produit supprimé !');
                                }
                            }}
                            className={`${btnStyles.button} ${btnStyles.supprimer}`}
                        >
                            Supprimer
                        </button>
                    )}
                    {onEdit && (
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                setShowModal(true);
                            }}
                            className={`${btnStyles.button} ${btnStyles.modifier}`}
                        >
                            Modifier
                        </button>
                    )}
                </div>
            )}

            {/* Modal d’édition (Admin) */}
            {showModal && ModalComponent && (
                <ModalComponent
                    isOpen={showModal}
                    mode={modalMode}
                    {...(isPack ? { pack: item } : { product: item })}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        onUpdate?.();
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
}
