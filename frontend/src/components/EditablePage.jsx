import React, { lazy, Suspense, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosInstance";
import styles from '../styles/pages/AboutSection.module.css';

// L'éditeur (TinyMCE + interface admin) n'est chargé que lorsqu'un admin édite la page
const PageEditor = lazy(() => import('./PageEditor'));

export default function EditablePage({ slug, isAdmin }) {
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const editFromNav = location.state?.edit === true;

    useEffect(() => {
        setLoading(true);
        axiosInstance
            .get(`/pages/${slug}`)
            .then(res => {
                setContent(res.data.content);
                setTitle(res.data.title || "");
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
                setContent("<p>Page introuvable ou erreur serveur.</p>");
                setTitle("");
            });
    }, [slug]);

    // Quitte l'édition : l'état { edit: true } de la navigation admin doit aussi être effacé,
    // sinon la page reste bloquée en mode édition
    const exitEdit = () => {
        setEditMode(false);
        if (editFromNav) navigate(location.pathname, { replace: true, state: null });
    };

    if (loading) return <p className="page-loading" role="status">Chargement…</p>;

    if (isAdmin && (editMode || editFromNav)) {
        return (
            <Suspense fallback={<p className="page-loading" role="status">Chargement de l’éditeur…</p>}>
                <PageEditor
                    slug={slug}
                    title={title}
                    content={content}
                    onExit={exitEdit}
                    onSaved={saved => {
                        setTitle(saved.title);
                        setContent(saved.content);
                        setMessage('Page enregistrée.');
                        exitEdit();
                    }}
                />
            </Suspense>
        );
    }

    return (
        <div className={styles.aboutSection}>
            {title && <h1 className="title">{title}</h1>}
            <div dangerouslySetInnerHTML={{ __html: content }} />
            {message && <p className="page-message" role="status">{message}</p>}
        </div>
    );
}
