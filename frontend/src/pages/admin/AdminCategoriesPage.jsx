// src/pages/admin/AdminCategoriesPage.jsx
import React, { useState, useEffect } from 'react';
import { FolderTree, Tags, Layers, Plus, Pencil, Trash2, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../../services/axiosInstance';
import AdminHeader from '../../components/admin/AdminHeader';
import Modal from '../../components/ui/Modal';
import { Alert, SubmitButton } from '../../components/admin/FormControls';
import ui from '../../styles/components/AdminUI.module.css';

// Configuration des deux types gérés sur cette page
const TYPES = {
    categorie: {
        endpoint: '/categories',
        label: 'catégorie',
        title: 'Catégories de produits',
        desc: 'Classent les produits de la boutique.',
        icon: Tags,
    },
    sousCategorie: {
        endpoint: '/sous-categories',
        label: 'sous-catégorie',
        title: 'Sous-catégories de packs',
        desc: 'Classent les packs dans l’onglet « Packs ».',
        icon: Layers,
    },
};

export default function AdminCategoriesPage() {
    const [lists, setLists] = useState({ categorie: [], sousCategorie: [] });
    const [loadError, setLoadError] = useState('');
    // Fenêtre : { type, item } (item = null pour un ajout)
    const [editor, setEditor] = useState(null);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [catRes, sousCatRes] = await Promise.all([
                axiosInstance.get(TYPES.categorie.endpoint),
                axiosInstance.get(TYPES.sousCategorie.endpoint),
            ]);
            setLists({ categorie: catRes.data, sousCategorie: sousCatRes.data });
            setLoadError('');
        } catch (err) {
            console.error('Erreur chargement admin', err);
            setLoadError('Impossible de charger les catégories.');
        }
    };

    const openEditor = (type, item = null) => {
        setEditor({ type, item });
        setName(item?.nom || '');
        setFormError('');
    };

    const closeEditor = () => setEditor(null);

    const handleSubmit = async e => {
        e.preventDefault();
        const nom = name.trim();
        if (!nom) { setFormError('Le nom est obligatoire.'); return; }

        const { type, item } = editor;
        const { endpoint, label } = TYPES[type];
        setSaving(true);
        setFormError('');
        try {
            if (item) await axiosInstance.put(`${endpoint}/${item.id}`, { nom });
            else await axiosInstance.post(endpoint, { nom });
            toast.success(item ? `${capitalize(label)} renommée.` : `${capitalize(label)} ajoutée.`);
            closeEditor();
            fetchAll();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Erreur lors de l’enregistrement.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (type, item) => {
        const { endpoint, label } = TYPES[type];
        if (!window.confirm(`Supprimer la ${label} « ${item.nom} » ?`)) return;
        try {
            await axiosInstance.delete(`${endpoint}/${item.id}`);
            toast.success(`${capitalize(label)} supprimée.`);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.message || `Impossible de supprimer cette ${label} (elle est peut-être encore utilisée).`);
        }
    };

    const total = lists.categorie.length + lists.sousCategorie.length;

    return (
        <div>
            <AdminHeader
                icon={FolderTree}
                title="Catégories"
                subtitle={`${total} élément${total > 1 ? 's' : ''} pour organiser la boutique`}
            />

            <div className={ui.page}>
                {loadError && <Alert>{loadError}</Alert>}

                <div className={ui.grid2}>
                    {Object.entries(TYPES).map(([type, { title, desc, label, icon }]) => {
                        const Icon = icon;
                        return (
                        <section key={type} className={ui.panel}>
                            <div className={ui.panelHeader}>
                                <h2 className={ui.panelTitle}>
                                    <Icon size={20} aria-hidden="true" /> {title}
                                    <span className={ui.count}>{lists[type].length}</span>
                                </h2>
                                <button
                                    type="button"
                                    className={`${ui.btn} ${ui.btnPrimary} ${ui.btnSmall}`}
                                    onClick={() => openEditor(type)}
                                >
                                    <Plus size={16} aria-hidden="true" /> Ajouter
                                </button>
                            </div>
                            <p className={ui.panelDesc}>{desc}</p>

                            {lists[type].length === 0 ? (
                                <p className={ui.empty}>Aucune {label} pour l’instant.</p>
                            ) : (
                                <ul className={ui.list}>
                                    {lists[type].map(item => (
                                        <li key={item.id} className={ui.listItem}>
                                            <span className={ui.listMain} title={item.nom}>{item.nom}</span>
                                            <div className={ui.listActions}>
                                                <button
                                                    type="button"
                                                    className={ui.iconBtn}
                                                    onClick={() => openEditor(type, item)}
                                                    aria-label={`Renommer ${item.nom}`}
                                                    title="Renommer"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`${ui.iconBtn} ${ui.iconBtnDanger}`}
                                                    onClick={() => handleDelete(type, item)}
                                                    aria-label={`Supprimer ${item.nom}`}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                        );
                    })}
                </div>
            </div>

            {editor && (
                <Modal
                    isOpen
                    size="sm"
                    title={editor.item
                        ? `Renommer la ${TYPES[editor.type].label}`
                        : `Nouvelle ${TYPES[editor.type].label}`}
                    onClose={closeEditor}
                >
                    <form onSubmit={handleSubmit} className={ui.form} noValidate>
                        <Alert>{formError}</Alert>
                        <div className={ui.field}>
                            <label className={ui.label} htmlFor="category-name">Nom</label>
                            <input
                                id="category-name"
                                className={ui.input}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder={editor.type === 'categorie' ? 'Ex. Sonorisation' : 'Ex. Packs soirée'}
                                maxLength={100}
                                autoFocus
                            />
                        </div>
                        <div className={ui.formActions}>
                            <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={closeEditor}>
                                Annuler
                            </button>
                            <SubmitButton loading={saving} icon={editor.item ? Save : Plus}>
                                {editor.item ? 'Enregistrer' : 'Ajouter'}
                            </SubmitButton>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
