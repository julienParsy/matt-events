// src/hooks/useLogo.js
import { useEffect, useState } from "react";
import axiosInstance from "../services/axiosInstance";

export default function useLogo(defaultUrl = "") {
    const [logoUrl, setLogoUrl] = useState(defaultUrl);

    useEffect(() => {
        axiosInstance.get('/admins/logo')
            .then(res => {
                const url = res.data?.url;
                if (url) setLogoUrl(url);
            })
            .catch(() => {/* fallback */ });
    }, []);

    // favicon + apple-touch-icon
    useEffect(() => {
        if (!logoUrl) return;
        const ensureLink = (rel) => {
            let link = document.querySelector(`link[rel='${rel}']`);
            if (!link) {
                link = document.createElement('link');
                link.rel = rel;
                document.head.appendChild(link);
            }
            link.href = logoUrl;
        };
        ensureLink('icon');
        ensureLink('shortcut icon');
        ensureLink('apple-touch-icon');
    }, [logoUrl]);

    // mise à jour instantanée après upload
    useEffect(() => {
        const handler = (e) => {
            const { url } = e.detail || {};
            if (url) setLogoUrl(url);
        };
        window.addEventListener('logo:updated', handler);
        return () => window.removeEventListener('logo:updated', handler);
    }, []);

    return logoUrl;
}
