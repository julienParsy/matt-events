// src/components/Video.jsx
import React from 'react';
import styles from '../styles/components/Video.module.css';

function toEmbedUrl(url) {
    if (!url) return '';

    const youtubeWatchRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/;
    const youtuBeRegex = /(?:https?:\/\/)?youtu\.be\/([^?&]+)/;
    const youtubeEmbedRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?&]+)/;

    let match;
    if ((match = url.match(youtubeWatchRegex))) {
        return `https://www.youtube.com/embed/${match[1]}`;
    } else if ((match = url.match(youtuBeRegex))) {
        return `https://www.youtube.com/embed/${match[1]}`;
    } else if ((match = url.match(youtubeEmbedRegex))) {
        return url;
    }
    return url;
}

export default function Video({ videoUrl }) {
    if (!videoUrl) return null;

    const embedUrl = toEmbedUrl(videoUrl);
    return (
        <div >
            <iframe
                className={styles.videoIframe}
                src={embedUrl}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />
        </div>
    );
}
