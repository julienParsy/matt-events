// @feature pages
// Mode édition des pages (À propos, Confidentialité, Mentions légales) : chargé à part,
// uniquement par un admin qui édite (TinyMCE et l'interface admin ne pèsent pas sur les visiteurs).
import React, { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { FilePen, Save, Eye } from "lucide-react";
import axiosInstance from "../../services/axiosInstance";
import useTheme from "../../hooks/useTheme";
import AdminHeader from "../admin/AdminHeader";
import { Alert, SubmitButton } from "../admin/FormControls";
import ui from '../../styles/components/AdminUI.module.css';

export default function PageEditor({ slug, title, content, onSaved, onExit }) {
    const { theme } = useTheme();
    const [draft, setDraft] = useState(content);
    const [draftTitle, setDraftTitle] = useState(title);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const save = async e => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await axiosInstance.put(`/pages/${slug}`, { content: draft, title: draftTitle });
            onSaved({ title: draftTitle, content: draft });
        } catch {
            setError('Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <AdminHeader icon={FilePen} title={title || 'Édition de page'} subtitle="Modifiez le titre et le contenu, puis enregistrez." />

            <div className={ui.page}>
                <form className={`${ui.panel} ${ui.form}`} onSubmit={save}>
                    <Alert>{error}</Alert>

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
                        <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={onExit} disabled={saving}>
                            <Eye size={17} aria-hidden="true" /> Annuler et voir la page
                        </button>
                        <SubmitButton loading={saving} icon={Save}>Enregistrer</SubmitButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
