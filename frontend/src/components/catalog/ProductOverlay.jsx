// src/components/catalog/ProductOverlay.jsx
import React, { useEffect } from 'react';
import overlayStyles from '../../styles/components/ProductOverlay.module.css';
import modalStyles from '../../styles/components/Modal.module.css';
import VideoOverlay from './VideoOverlay';

const BULLET = /^\s*[-•]\s+/;

// "- Table de mixage — Mackie PROFX16V2 × 1" → { name, detail, qty }
function parseItem(line) {
    let text = line.replace(BULLET, '');
    let qty = null;
    let tail = '';

    const m = text.match(/^(.*?)\s×\s*(\d+)\b\s*(.*)$/);
    if (m) {
        text = m[1];
        qty = m[2];
        tail = m[3];
    }

    const [name, ...rest] = text.split(' — ');
    const detail = [rest.join(' — '), tail].filter(Boolean).join(' ');
    return { name, detail, qty };
}

// mode : 'video' | 'description'
export default function ProductOverlay({ produit, mode = 'description', onClose }) {
    // Fermeture avec la touche Échap (le lecteur vidéo gère son propre clavier)
    useEffect(() => {
        if (mode === 'video') return undefined;
        const onKeyDown = e => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose, mode]);

    // Vidéo(s) : lecteur plein écran dédié
    if (mode === 'video') {
        return <VideoOverlay title={produit.nom} videoUrl={produit.video_url} onClose={onClose} />;
    }

    const lines = produit.description
        ? produit.description.split('\n').filter(line => line.trim() !== '')
        : [];
    // Liste à puces (contenu d'un pack) → vraie liste ; sinon paragraphes
    const isList = lines.length > 0 && lines.every(l => BULLET.test(l));

    return (
        <div className={overlayStyles.productOverlay} onClick={onClose}>
            <div
                className={`${overlayStyles.overlayContent} ${overlayStyles.overlayContentText}`}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={produit.nom}
            >
                <button
                    className={modalStyles.modalClose}
                    onClick={e => { e.stopPropagation(); onClose(); }}
                    aria-label="Fermer la fenêtre"
                >
                    ✕
                </button>

                <h2 className={overlayStyles.overlayTitle}>{produit.nom}</h2>

                {lines.length > 0
                        ? isList
                            ? (
                                <ul className={overlayStyles.overlayList}>
                                    {lines.map((line, i) => {
                                        const { name, detail, qty } = parseItem(line);
                                        return (
                                            <li key={i} className={overlayStyles.overlayItem}>
                                                <div className={overlayStyles.overlayItemInfo}>
                                                    <span className={overlayStyles.overlayItemName}>{name}</span>
                                                    {detail && (
                                                        <span className={overlayStyles.overlayItemDetail}>{detail}</span>
                                                    )}
                                                </div>
                                                {qty && (
                                                    <span className={overlayStyles.overlayQty}>× {qty}</span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )
                            : (
                                <div className={overlayStyles.overlayBody}>
                                    {lines.map((line, i) => (
                                        <p key={i} className={overlayStyles.overlayText}>{line}</p>
                                    ))}
                                </div>
                            )
                        : <p className={overlayStyles.overlayEmpty}>Aucune description disponible.</p>}
            </div>
        </div>
    );
}