// src/pages/admin/AdminLogoSettingsPage.jsx
import React, { useEffect, useState } from 'react';
import { Image, Upload, Sun, Moon } from 'lucide-react';
import { toast } from 'react-toastify';
import { uploadImage } from '../../utils/upload';
import { resizeImage } from '../../utils/image';
import axiosInstance from '../../services/axiosInstance';
import useLogo from '../../hooks/useLogo';
import AdminHeader from '../../components/admin/AdminHeader';
import { Alert, ImagePicker, SubmitButton } from '../../components/admin/FormControls';
import ui from '../../styles/components/AdminUI.module.css';
import styles from '../../styles/pages/AdminLogoSettingsPage.module.css';

export default function AdminLogoSettingsPage() {
    const currentLogo = useLogo();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Aperçu du fichier choisi dans la fausse barre de navigation
    useEffect(() => {
        if (!selectedFile) { setPreview(''); return undefined; }
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [selectedFile]);

    const handleUpload = async e => {
        e.preventDefault();
        if (!selectedFile) { setError('Choisissez d’abord une image.'); return; }
        setError('');
        setLoading(true);
        try {
            // 1) Réduction à 512 px puis envoi vers Firebase => URL
            const downloadURL = await uploadImage(await resizeImage(selectedFile));
            if (!downloadURL) throw new Error('URL manquante après l’envoi.');
            // 2) Enregistrement de l'URL côté backend
            const { data } = await axiosInstance.post('/admins/logo', { url: downloadURL });
            toast.success(data?.message || 'Logo mis à jour !');
            setSelectedFile(null);
            // 3) Mise à jour immédiate de la barre de navigation
            window.dispatchEvent(new CustomEvent('logo:updated', { detail: { url: data?.url || downloadURL } }));
        } catch (err) {
            console.error('POST /admins/logo error:', err?.response?.data || err);
            setError(err?.response?.data?.message || 'Erreur lors de l’envoi du logo.');
        } finally {
            setLoading(false);
        }
    };

    const shownLogo = preview || currentLogo;

    return (
        <div>
            <AdminHeader icon={Image} title="Logo & favicon" subtitle="Le logo apparaît dans la barre de navigation et dans l’onglet du navigateur." />

            <div className={ui.page}>
                <div className={ui.grid2}>
                    <section className={ui.panel}>
                        <div className={ui.panelHeader}>
                            <h2 className={ui.panelTitle}><Upload size={20} aria-hidden="true" /> Nouveau logo</h2>
                        </div>
                        <p className={ui.panelDesc}>Image carrée de préférence (512 × 512 px ou plus), affichée dans un cercle.</p>

                        <form onSubmit={handleUpload} className={ui.form} noValidate>
                            <Alert>{error}</Alert>
                            <ImagePicker file={selectedFile} currentUrl={currentLogo} onChange={setSelectedFile} round label="Choisir un logo" />
                            <div className={ui.formActions}>
                                {selectedFile && (
                                    <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={() => setSelectedFile(null)} disabled={loading}>
                                        Annuler
                                    </button>
                                )}
                                <SubmitButton loading={loading} loadingLabel="Envoi…" icon={Upload} disabled={!selectedFile || loading}>
                                    Enregistrer le logo
                                </SubmitButton>
                            </div>
                        </form>
                    </section>

                    <section className={ui.panel}>
                        <div className={ui.panelHeader}>
                            <h2 className={ui.panelTitle}><Moon size={20} aria-hidden="true" /> Aperçu</h2>
                            {preview && <span className={`${ui.tag} ${ui.tagWarning}`}>Non enregistré</span>}
                        </div>
                        <p className={ui.panelDesc}>Rendu dans la barre de navigation (thème sombre).</p>

                        <div className={styles.mockNav}>
                            {shownLogo
                                ? <img src={shownLogo} alt="Aperçu du logo" className={styles.mockLogo} />
                                : <span className={styles.mockLogoEmpty} aria-hidden="true" />}
                            <span className={styles.mockLinks}>Accueil · Boutique</span>
                        </div>

                        <div className={styles.tabMock} aria-hidden="true">
                            {shownLogo && <img src={shownLogo} alt="" />}
                            <span>Matt'events – sound &amp; light</span>
                        </div>

                        <Alert type="info">
                            <Sun size={14} aria-hidden="true" /> En thème clair, le site affiche le logo dédié
                            (<code>public/logo-light.svg</code>), qui ne change pas ici.
                        </Alert>
                    </section>
                </div>
            </div>
        </div>
    );
}
