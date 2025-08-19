// src/components/ProductOverlay.jsx
import React from 'react';
import overlayStyles from '../styles/components/Overlay.module.css';
import modalStyles from '../styles/components/Modal.module.css';
import videoStyles from '../styles/components/video.module.css';
import Video from './Video';

export default function ProductOverlay({ produit, onClose }) {
    return (
        <div className={overlayStyles.productOverlay} onClick={onClose}>
            <div className={overlayStyles.overlayContent} onClick={e => e.stopPropagation()}>
                <button
                    className={modalStyles.modalClose}
                    onClick={e => { e.stopPropagation(); onClose(); }}
                    aria-label='Fermer la fenêtre'
                >
                    ✕
                </button>

                <h2 className={overlayStyles.overlayTitle}>{produit.nom}</h2>
                {produit.video_url && (
                    <div className={videoStyles.videoContainer}>
                        <Video
                            produit={produit}
                            videoUrl={produit.video_url}
                        />
                    </div>
                )}
                <p className={modalStyles.modalText}>
                    {produit.description || "Aucune description disponible."}
                </p>

            </div>
        </div>
    );
}
