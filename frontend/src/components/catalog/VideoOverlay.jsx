// src/components/catalog/VideoOverlay.jsx
// Lecteur vidéo plein écran (mode « cinéma ») : une ou plusieurs vidéos par produit.
import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink, PlayCircle } from 'lucide-react';
import { parseVideoUrls, toEmbedUrl, getThumbnail, getYoutubeId, isShort } from '../../utils/video';
import styles from '../../styles/components/VideoOverlay.module.css';

export default function VideoOverlay({ title, videoUrl, onClose }) {
    const videos = parseVideoUrls(videoUrl);
    const [index, setIndex] = useState(0);
    const closeRef = useRef(null);
    const count = videos.length;
    const multiple = count > 1;

    const go = step => setIndex(i => (i + step + count) % count);

    // Clavier (Échap, ←, →), page bloquée derrière, focus sur « fermer »
    useEffect(() => {
        const onKeyDown = e => {
            if (e.key === 'Escape') onClose();
            if (multiple && e.key === 'ArrowLeft') go(-1);
            if (multiple && e.key === 'ArrowRight') go(1);
        };
        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeRef.current?.focus();
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onClose, multiple, count]);

    if (count === 0) return null;

    const current = videos[index];
    const vertical = isShort(current);
    const isYoutube = !!getYoutubeId(current);

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <div
                className={`${styles.dialog} ${multiple ? styles.withThumbs : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label={`Vidéo : ${title}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <header className={styles.header}>
                    <div className={styles.headerText}>
                        <h2 className={styles.title}>{title}</h2>
                        {multiple && <span className={styles.counter}>Vidéo {index + 1} / {count}</span>}
                    </div>
                    <a
                        className={styles.external}
                        href={current}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={isYoutube ? 'Ouvrir sur YouTube' : 'Ouvrir la vidéo'}
                    >
                        <ExternalLink size={16} aria-hidden="true" />
                        <span>{isYoutube ? 'YouTube' : 'Ouvrir'}</span>
                    </a>
                    <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Fermer la vidéo">
                        <X size={22} />
                    </button>
                </header>

                <div className={styles.stage}>
                    {multiple && (
                        <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={() => go(-1)} aria-label="Vidéo précédente">
                            <ChevronLeft size={28} />
                        </button>
                    )}

                    <div className={`${styles.player} ${vertical ? styles.vertical : ''}`}>
                        <iframe
                            key={current}
                            src={toEmbedUrl(current, { autoplay: true })}
                            title={`${title} — vidéo ${index + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        />
                    </div>

                    {multiple && (
                        <button type="button" className={`${styles.nav} ${styles.next}`} onClick={() => go(1)} aria-label="Vidéo suivante">
                            <ChevronRight size={28} />
                        </button>
                    )}
                </div>

                {multiple && (
                    <div className={styles.thumbs} role="tablist" aria-label="Choisir une vidéo">
                        {videos.map((url, i) => {
                            const thumb = getThumbnail(url);
                            return (
                                <button
                                    key={url + i}
                                    type="button"
                                    role="tab"
                                    aria-selected={i === index}
                                    aria-label={`Vidéo ${i + 1}`}
                                    className={`${styles.thumb} ${i === index ? styles.thumbActive : ''}`}
                                    onClick={() => setIndex(i)}
                                >
                                    {thumb
                                        ? <img src={thumb} alt="" loading="lazy" />
                                        : <PlayCircle size={26} aria-hidden="true" />}
                                    <span className={styles.thumbIndex}>{i + 1}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
