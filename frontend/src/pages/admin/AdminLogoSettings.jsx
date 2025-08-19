// src/pages/admin/AdminLogoSettings.jsx
import React, { useState } from "react";
import { uploadImage } from "../../utils/upload";
import axiosInstance from "../../services/axiosInstance";
import styles from "../../styles/pages/AdminLogoSettings.module.css";
import NavAdmin from './NavAdmin';
import stylesBack from '../../styles/components/BackButton.module.css';
import btnStyles from '../../styles/components/Button.module.css';
import formStyles from '../../styles/components/Modal.module.css';
import stylesLogo from '../../styles/components/NavBar.module.css';
import { toast } from "react-toastify";

export default function AdminLogoSettings() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        setSelectedFile(file || null);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setPreview("");
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return toast.error("Veuillez sélectionner un fichier.");
        setLoading(true);
        try {
            // 1) Upload vers Firebase => URL
            const downloadURL = await uploadImage(selectedFile);
            if (!downloadURL) {
                toast.error("Upload terminé mais URL manquante.");
                return;
            }
            // 2) Enregistrement URL côté backend
            const { data } = await axiosInstance.post("/admins/logo", { url: downloadURL });
            toast.success(data?.message || "Logo mis à jour !");
            // 3) Reset local
            setSelectedFile(null);
            setPreview("");
            // 4) Optionnel: notifier l'app pour MAJ instantanée du header
            window.dispatchEvent(new CustomEvent('logo:updated', { detail: { url: data?.url || downloadURL } }));
        } catch (err) {
            console.error("POST /admins/logo error:", err?.response?.data || err);
            toast.error(err?.response?.data?.message || "Erreur lors de l'upload du logo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className='banner'>
                <h1>Changer le logo du site</h1>
                <NavAdmin />
            </div>

            <div className={styles.logoSettings}>
                <nav className={stylesBack.breadcrumb}>
                    <span className={stylesBack.breadcrumbItem} onClick={() => window.location.href = '/admin'}>Admin</span>
                    <span className={stylesBack.breadcrumbSep}>/</span>
                    <span className={stylesBack.breadcrumbItemActive}>Logo & Favicon</span>
                </nav>

                <form onSubmit={handleUpload} className={formStyles.modalBody}>
                    <h2>Choisissez votre logo</h2>

                    <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        className={`${btnStyles.button} ${btnStyles.btnFileUpload}`}
                        onClick={() => document.getElementById('file-upload').click()}
                        disabled={loading}
                    >
                        {selectedFile ? selectedFile.name : "Choisir un fichier"}
                    </button>

                    {preview && (
                        <div className={stylesLogo.navbarLogo}>
                            <img src={preview} alt="Aperçu logo" loading="lazy" />
                        </div>
                    )}

                    <button className={`${btnStyles.button} ${btnStyles.btnAjouter}`} type="submit" disabled={loading}>
                        {loading ? "Chargement..." : "Enregistrer"}
                    </button>
                </form>
            </div>
        </div>
    );
}
