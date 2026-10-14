import React, { useEffect, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { useLocation, useNavigate } from "react-router-dom";
import { FilePen, Save, Eye } from "lucide-react";
import axiosInstance from "../services/axiosInstance";
import useTheme from "../hooks/useTheme";
import AdminHeader from "./admin/AdminHeader";
import { Alert, SubmitButton } from "./admin/FormControls";
import styles from '../styles/pages/AboutSection.module.css';
import stylesBtn from '../styles/components/Button.module.css';
import ui from '../styles/components/AdminUI.module.css';


export default function EditablePage({ slug, isAdmin }) {
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [draft, setDraft] = useState("");
    const [draftTitle, setDraftTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null); // { type, text }
    const location = useLocation();
    const navigate = useNavigate();
    const { theme } = useTheme();
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

    useEffect(() => {
        if ((editMode || editFromNav) && !loading) {
            setDraft(content);
            setDraftTitle(title);
        }
    }, [editMode, editFromNav, loading, content, title]);

    // Quitte l'édition : l'état { edit: true } de la navigation admin doit aussi être effacé,
    // sinon la page reste bloquée en mode édition
    const exitEdit = () => {
        setEditMode(false);
        if (editFromNav) navigate(location.pathname, { replace: true, state: null });
    };

    const save = async e => {
        e.preventDefault();
        setSaving(true);
        try {
            await axiosInstance.put(`/pages/${slug}`, { content: draft, title: draftTitle });
            setContent(draft);
            setTitle(draftTitle);
            setMessage({ type: 'success', text: 'Page enregistrée.' });
            exitEdit();
        } catch {
            setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className={ui.page}>Chargement…</div>;

    if (isAdmin && (editMode || editFromNav)) {
        return (
            <div>
                <AdminHeader icon={FilePen} title={title || 'Édition de page'} subtitle="Modifiez le titre et le contenu, puis enregistrez." />

                <div className={ui.page}>
                    <form className={`${ui.panel} ${ui.form}`} onSubmit={save}>
                        {message?.type === 'error' && <Alert>{message.text}</Alert>}

                        <div className={ui.field}>
                            <label className={ui.label} htmlFor="page-title">Titre</label>
                            <input
                                id="page-title"
                                type="text"
                                value={draftTitle}
                                onChange={e => setDraftTitle(e.target.value)}
                                placeholder="Titre de la page"
                                className={ui.input}
                            />
                        </div>

                        <div className={ui.field}>
                            <span className={ui.label}>Contenu</span>
                            {/* key : TinyMCE ne change pas de thème à chaud, on le recrée */}
                            <Editor
                                key={theme}
                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                value={draft}
                                init={{
                                    height: 480,
                                    menubar: false,
                                    skin: theme === 'dark' ? 'oxide-dark' : 'oxide',
                                    content_css: theme === 'dark' ? 'dark' : 'default',
                                    plugins: "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount",
                                    toolbar:
                                        "undo redo | formatselect | bold italic backcolor | " +
                                        "alignleft aligncenter alignright alignjustify | " +
                                        "bullist numlist outdent indent | removeformat | help"
                                }}
                                onEditorChange={setDraft}
                            />
                        </div>

                        <div className={ui.formActions}>
                            <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={exitEdit} disabled={saving}>
                                <Eye size={17} aria-hidden="true" /> Annuler et voir la page
                            </button>
                            <SubmitButton loading={saving} icon={Save}>Enregistrer</SubmitButton>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.aboutSection}>
            {title && <h1 className="title">{title}</h1>}
            <div dangerouslySetInnerHTML={{ __html: content }} />
            {message && (
                <div className={stylesBtn.divNouveauProduit}>
                    <Alert type={message.type}>{message.text}</Alert>
                </div>
            )}
        </div>
    );
}
