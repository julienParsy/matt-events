// src/components/admin/FormControls.jsx
// Petits composants de formulaire partagés par les pages admin.
import { useEffect, useId, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, Eye, EyeOff, ImagePlus, Loader2, Plus, Trash2, PlayCircle } from 'lucide-react';
import { MAX_VIDEOS, getThumbnail, isValidUrl } from '../../utils/video';
import ui from '../../styles/components/AdminUI.module.css';

/** Message coloré : type = 'error' | 'success' | 'info' */
export function Alert({ type = 'error', children }) {
    if (!children) return null;
    const Icon = type === 'success' ? CheckCircle2 : type === 'info' ? Info : AlertCircle;
    const cls = type === 'success' ? ui.alertSuccess : type === 'info' ? ui.alertInfo : ui.alertError;
    return (
        <div className={`${ui.alert} ${cls}`} role={type === 'error' ? 'alert' : 'status'}>
            <Icon size={18} aria-hidden="true" />
            <span>{children}</span>
        </div>
    );
}

/** Bouton d'envoi avec indicateur de chargement */
export function SubmitButton({ loading, loadingLabel = 'Enregistrement…', icon: Icon, children, className = '', ...rest }) {
    return (
        <button type="submit" className={`${ui.btn} ${ui.btnPrimary} ${className}`} disabled={loading} aria-busy={loading} {...rest}>
            {loading
                ? <><Loader2 size={17} className={ui.spin} aria-hidden="true" /> {loadingLabel}</>
                : <>{Icon && <Icon size={17} aria-hidden="true" />} {children}</>}
        </button>
    );
}

/** Champ mot de passe avec bouton afficher / masquer */
export function PasswordInput({ id, value, onChange, autoComplete = 'current-password', ...rest }) {
    const [visible, setVisible] = useState(false);
    return (
        <div className={ui.inputWrap}>
            <input
                id={id}
                className={ui.input}
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                {...rest}
            />
            <button
                type="button"
                className={ui.inputBtn}
                onClick={() => setVisible(v => !v)}
                aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                aria-pressed={visible}
            >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
}

/**
 * Sélecteur d'image : clic ou glisser-déposer, avec aperçu.
 * - file : fichier choisi (ou null)
 * - currentUrl : image déjà enregistrée (mode édition)
 */
export function ImagePicker({ file, currentUrl, onChange, round = false, label = 'Choisir une image' }) {
    const inputId = useId();
    const [preview, setPreview] = useState('');
    const [dragging, setDragging] = useState(false);

    // Aperçu local du fichier choisi (URL libérée au changement)
    useEffect(() => {
        if (!file) { setPreview(''); return undefined; }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const shown = preview || currentUrl;

    const pick = f => {
        if (f && f.type.startsWith('image/')) onChange(f);
    };

    return (
        <label
            htmlFor={inputId}
            className={`${ui.drop} ${dragging ? ui.dropActive : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
        >
            <span className={`${ui.dropPreview} ${round ? ui.dropPreviewRound : ''}`}>
                {shown ? <img src={shown} alt="" /> : <ImagePlus size={28} aria-hidden="true" />}
            </span>
            <span className={ui.dropText}>
                <strong>{file ? 'Image sélectionnée' : shown ? 'Remplacer l’image' : label}</strong>
                <span>{file ? file.name : 'Cliquez ou glissez une image ici (JPG, PNG, WebP…)'}</span>
            </span>
            <input
                id={inputId}
                type="file"
                accept="image/*"
                className={ui.srOnly}
                onChange={e => pick(e.target.files?.[0])}
            />
        </label>
    );
}

/**
 * Liste de liens vidéo (YouTube…), une ligne par vidéo avec miniature.
 * - videos : tableau de liens (des lignes vides sont permises pendant la saisie)
 */
export function VideoListInput({ videos, onChange, idPrefix = 'video' }) {
    const list = videos.length ? videos : [''];

    const update = (i, value) => onChange(list.map((v, j) => (j === i ? value : v)));
    const remove = i => onChange(list.filter((_, j) => j !== i));
    const add = () => onChange([...list, '']);

    return (
        <div className={ui.videoList}>
            {list.map((url, i) => {
                const thumb = getThumbnail(url);
                const invalid = url.trim() !== '' && !isValidUrl(url.trim());
                return (
                    <div key={i} className={ui.videoRow}>
                        <span className={ui.videoThumb} aria-hidden="true">
                            {thumb ? <img src={thumb} alt="" /> : <PlayCircle size={20} />}
                        </span>
                        <input
                            id={i === 0 ? idPrefix : `${idPrefix}-${i}`}
                            className={ui.input}
                            type="url"
                            value={url}
                            onChange={e => update(i, e.target.value)}
                            placeholder="https://youtube.com/watch?v=…"
                            aria-label={`Lien de la vidéo ${i + 1}`}
                            aria-invalid={invalid}
                        />
                        <button
                            type="button"
                            className={`${ui.iconBtn} ${ui.iconBtnDanger}`}
                            onClick={() => remove(i)}
                            disabled={list.length === 1 && !url}
                            aria-label={`Retirer la vidéo ${i + 1}`}
                            title="Retirer"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                );
            })}
            {list.length < MAX_VIDEOS && (
                <button type="button" className={`${ui.btn} ${ui.btnSecondary} ${ui.btnSmall} ${ui.videoAdd}`} onClick={add}>
                    <Plus size={15} aria-hidden="true" /> Ajouter une vidéo
                </button>
            )}
        </div>
    );
}
