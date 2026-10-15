// @feature catalogue — Carte commune produit / pack (boutique et admin)
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingCart, Package, ImageOff, FileText, ListChecks, Pencil, Trash2, Ban } from 'lucide-react';
import btnStyles from '../../styles/components/Button.module.css';
import cardStyles from '../../styles/components/Card.module.css';
import { parseVideoUrls } from '../../utils/video';
import { formatPrice } from '../../utils/cart';

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

// Pastille de stock : quantité disponible (vert) ou indisponible (rouge)
function StockBadge({ remaining }) {
    if (remaining <= 0) {
        return <span className={`${cardStyles.badge} ${cardStyles.badgeOut}`}>Indisponible</span>;
    }
    return (
        <span className={`${cardStyles.badge} ${cardStyles.badgeOk}`}>
            {remaining} dispo
        </span>
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
    OverlayComponent,
}) {
    // null | 'video' | 'description'
    const [overlayMode, setOverlayMode] = useState(null);
    const [imgError, setImgError] = useState(false);

    // Le garde-fou doit passer AVANT de lire item.*
    if (!item) return <div className={cardStyles.card}>Données manquantes.</div>;

    const stock = parseInt(item.stock, 10) || 0;
    const itemInCart = cart.find(p => p.id === item.id);
    const quantityInCart = itemInCart?.quantite || 0;
    const remaining = Math.max(stock - quantityInCart, 0);
    const isOutOfStock = remaining <= 0;

    const imageSrc = item.image || item.image_url;
    const showImage = imageSrc && !imgError;
    const price = Number(item.prix);

    const videoCount = parseVideoUrls(item.video_url).length;
    const hasVideo = videoCount > 0;
    const hasDescription = !!item.description;
    // Packs : nombre d'éléments inclus (la liste complète est dans l'overlay)
    const packItemCount = isPack && item.description
        ? item.description.split('\n').filter(l => l.trim() !== '').length
        : 0;
    const subtitle = isPack
        ? (packItemCount > 0 ? `${packItemCount} élément${packItemCount > 1 ? 's' : ''} inclus` : '')
        : item.modele;

    return (
        <article className={`${cardStyles.card} ${isOutOfStock ? cardStyles.cardOut : ''}`}>
            {/* ---------- Visuel ---------- */}
            <div className={cardStyles.media}>
                {showImage ? (
                    <img
                        src={imageSrc}
                        onError={() => setImgError(true)}
                        alt={item.nom}
                        className={cardStyles.productImage}
                        loading="lazy"
                    />
                ) : (
                    <div className={cardStyles.placeholder} aria-hidden="true">
                        {isPack ? <Package size={48} strokeWidth={1.4} /> : <ImageOff size={44} strokeWidth={1.4} />}
                    </div>
                )}

                <div className={cardStyles.badges}>
                    {isPack && (
                        <span className={`${cardStyles.badge} ${cardStyles.badgePack}`}>
                            <Package size={13} aria-hidden="true" /> Pack
                        </span>
                    )}
                    <StockBadge remaining={remaining} />
                </div>

                {hasVideo && OverlayComponent && (
                    <button
                        type="button"
                        onClick={() => setOverlayMode('video')}
                        className={`${btnStyles.btnVideo} ${cardStyles.videoBtn}`}
                        aria-label={videoCount > 1
                            ? `Voir les ${videoCount} vidéos de ${item.nom}`
                            : `Voir la vidéo de ${item.nom}`}
                        title={videoCount > 1 ? `Voir les ${videoCount} vidéos` : 'Voir la vidéo'}
                    >
                        <YoutubeIcon
                            className={btnStyles.iconYoutube}
                            bgClass={btnStyles.ytBg}
                            playClass={btnStyles.ytPlay}
                        />
                        {videoCount > 1 && <span className={cardStyles.videoCount}>{videoCount}</span>}
                    </button>
                )}
            </div>

            {/* ---------- Contenu ---------- */}
            <div className={cardStyles.body}>
                <h3 className={cardStyles.nom} title={item.nom}>{item.nom}</h3>
                {subtitle && <p className={cardStyles.modele} title={subtitle}>{subtitle}</p>}

                <div className={cardStyles.priceRow}>
                    <p className={cardStyles.prix}>
                        {Number.isFinite(price) ? formatPrice(price) : `${item.prix} €`}
                    </p>
                    {hasDescription && OverlayComponent && (
                        <button
                            type="button"
                            onClick={() => setOverlayMode('description')}
                            className={cardStyles.detailsLink}
                            aria-label={isPack
                                ? `Voir le contenu du pack ${item.nom}`
                                : `Lire la description de ${item.nom}`}
                        >
                            {isPack
                                ? <><ListChecks size={15} aria-hidden="true" /> Contenu</>
                                : <><FileText size={15} aria-hidden="true" /> Détails</>}
                        </button>
                    )}
                </div>

                {/* Bouton ajout panier */}
                {!isAdmin && onAdd && (
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onAdd(item); }}
                        disabled={isOutOfStock}
                        className={cardStyles.addBtn}
                    >
                        {isOutOfStock ? (
                            <><Ban size={18} aria-hidden="true" /> Indisponible</>
                        ) : (
                            <><ShoppingCart size={18} aria-hidden="true" /> {isPack ? 'Ajouter le pack' : 'Ajouter au panier'}</>
                        )}
                    </button>
                )}

                {/* Actions admin */}
                {isAdmin && (onEdit || onDelete) && (
                    <div className={cardStyles.adminActions}>
                        {onEdit && (
                            <button
                                type="button"
                                onClick={e => {
                                    e.stopPropagation();
                                    // La page admin ouvre sa fenêtre d'édition (et rafraîchit la liste après)
                                    onEdit(item);
                                }}
                                className={`${cardStyles.adminBtn} ${cardStyles.adminEdit}`}
                            >
                                <Pencil size={16} aria-hidden="true" /> Modifier
                            </button>
                        )}
                        {onDelete && (
                            <button
                                type="button"
                                onClick={e => {
                                    // La confirmation est demandée par la page (AdminCatalogPage)
                                    e.stopPropagation();
                                    onDelete(item.id);
                                }}
                                className={`${cardStyles.adminBtn} ${cardStyles.adminDelete}`}
                                aria-label={`Supprimer ${item.nom}`}
                                title="Supprimer"
                            >
                                <Trash2 size={16} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Portail : l'overlay plein écran ne dépend pas des styles de la card (transform, overflow) */}
            {overlayMode && OverlayComponent && createPortal(
                <OverlayComponent
                    produit={item}
                    mode={overlayMode}
                    onClose={() => setOverlayMode(null)}
                />,
                document.body
            )}
        </article>
    );
}
