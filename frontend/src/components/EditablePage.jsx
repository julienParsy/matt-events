import React, { useEffect, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import axiosInstance from "../services/axiosInstance";
import styles from '../styles/pages/AboutSection.module.css';
import stylesBtn from '../styles/components/button.module.css';
import stylesModal from '../styles/components/Modal.module.css';
import { useLocation } from "react-router-dom";
import NavAdmin from '../pages/admin/NavAdmin';


export default function EditablePage({ slug, isAdmin }) {
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [draft, setDraft] = useState("");
    const [draftTitle, setDraftTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const location = useLocation();
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

    const save = async () => {
        try {
            await axiosInstance.put(
                `/pages/${slug}`,
                { content: draft, title: draftTitle }
            );
            setContent(draft);
            setTitle(draftTitle);
            setEditMode(false);
            setMessage("✅ Enregistré !");
        } catch {
            setMessage("❌ Erreur lors de la sauvegarde.");
        }
    };

    if (loading) return <div>Chargement...</div>;
    if (isAdmin && (editMode || editFromNav)) {
        return (
            <div>
                <div className="banner">
                    <h1>{title}</h1>
                <NavAdmin />
                </div>
                    

            <div className={styles.aboutSection}>
                <label className={stylesModal.modalLabel} htmlFor="title">Titre</label>
                <input
                    type="text"
                    value={draftTitle}
                    onChange={e => setDraftTitle(e.target.value)}
                    placeholder="Titre de la page"
                    className={stylesModal.modalInput}
                />
                <label className={stylesModal.modalLabel} htmlFor="Contenu">Edition du contenu :</label>
                    <Editor
                        apiKey="jisb6yrtug7i1nzoue1qo59tahy3h0jpmumfi1g3eixw3gcz"
                        value={draft}
                        init={{
                            height: 400,
                            menubar: false,
                            plugins: "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount",
                            toolbar:
                                "undo redo | formatselect | bold italic backcolor | " +
                                "alignleft aligncenter alignright alignjustify | " +
                                "bullist numlist outdent indent | removeformat | help"
                        }}
                        onEditorChange={setDraft}
                    />

                <div className={stylesModal.modalButtons}>
                    <button className={`${stylesBtn.button} ${stylesModal.btnCancel}`}  onClick={() => setEditMode(false)}>Annuler</button>
                <button className={`${stylesBtn.button} ${stylesBtn.btnAjouter}`} onClick={save}>Enregistrer</button>
                </div>
                {message && <div style={{ marginTop: 12 }}>{message}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.aboutSection}>
            {title && <h1 className="title">{title}</h1>}
            <div dangerouslySetInnerHTML={{ __html: content }} />
            {message && <div className={stylesBtn.divNouveauProduit}>{message}</div>}
        </div>
    );
}
