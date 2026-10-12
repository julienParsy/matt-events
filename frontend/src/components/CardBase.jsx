// src/components/CardBase.jsx
import React, { useState } from 'react';
import btnStyles from '../styles/components/Button.module.css';
import cardStyles from '../styles/components/Card.module.css';

// Logo YouTube en SVG inline (pas de fichier externe à charger)
function YoutubeIcon({ className, bgClass, playClass }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 17"
            aria-hidden="true"
            focusable="false"
        >
            <rect className={bgClass} width="24" height="17" rx="4.5" />
            <path className={playClass} d="M9.6 12.2V4.8L16 8.5z" />
        </svg>
    );
}

export default function CardBase({
    item,
    isPack = false,
    cart = [],
    isAdmin = false,
    onAdd,
    onDelete,
    onEdit,
    onUpdate,
    OverlayComponent,
    ModalComponent,
    modalMode = 'edit',
}) {
    const [showModal, setShowModal] = useState(false);
    // null | 'video' | 'description'
    const [overlayMode, setOverlayMode] = useState(null);

    // Le garde-fou doit passer AVANT de lire item.*
    if (!item) return <div className={cardStyles.card}>Données manquantes.</div>;

    const stock = parseInt(item.stock, 10) || 0;
    const itemInCart = cart.find(p => p.id === item.id);
    const quantityInCart = itemInCart?.quantite || 0;
    const isOutOfStock = quantityInCart >= stock || stock <= 0;

    const hasVideo = !!item.video_url;
    const hasDescription = !!item.description;
    // Packs : nombre d'éléments inclus (la liste complète est dans l'overlay)
    const packItemCount = isPack && item.description
        ? item.description.split('\n').filter(l => l.trim() !== '').length
        : 0;
    const showDetailButtons = OverlayComponent && (hasVideo || hasDescription);

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
            {isPack && packItemCount > 0 && (
                <p className={cardStyles.modele}>
                    {packItemCount} élément{packItemCount > 1 ? 's' : ''} inclus
                </p>
            )}
            {!isPack && <p className={cardStyles.modele}>{item.modele}</p>}
            <p className={cardStyles.prix}>{item.prix} €</p>
            <p className={cardStyles.stock}>
                Quantité disponible : {stock - quantityInCart}
            </p>

            {/* Boutons de détails : uniquement ceux qui ont du contenu */}
            {showDetailButtons && (
                <div className={btnStyles.btnVoirContainer}>
                    {hasVideo && (
                        <button
                            onClick={() => setOverlayMode('video')}
                            className={`${btnStyles.btnVoir} ${btnStyles.btnVideo}`}
                            aria-label={`Voir la vidéo de ${item.nom}`}
                            title="Voir la vidéo"
                        >
                            <YoutubeIcon
                                className={btnStyles.iconYoutube}
                                bgClass={btnStyles.ytBg}
                                playClass={btnStyles.ytPlay}
                            />
                        </button>
                    )}
                    {hasDescription && (
                        <button
                            onClick={() => setOverlayMode('description')}
                            className={btnStyles.btnVoir}
                            aria-label={isPack
                                ? `Voir le contenu du pack ${item.nom}`
                                : `Lire la description de ${item.nom}`}
                        >
                            {isPack ? 'Voir le contenu' : 'Description'}
                        </button>
                    )}
                </div>
            )}

            {overlayMode && OverlayComponent && (
                <OverlayComponent
                    produit={item}
                    mode={overlayMode}
                    onClose={() => setOverlayMode(null)}
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
                        ? 'Indisponible'
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