import React, { useState, useEffect } from 'react';
import axiosInstance from '../../services/axiosInstance';
import NavAdmin from './NavAdmin';
import btnStyles from '../../styles/components/Button.module.css';
import modalStyles from '../../styles/components/Modal.module.css';
import styles from '../../styles/pages/AdminCategories.module.css';
import stylesBack from '../../styles/components/BackButton.module.css';

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [sousCategories, setSousCategories] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [isSousCategory, setIsSousCategory] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [catRes, sousCatRes] = await Promise.all([
                axiosInstance.get('/categories'),
                axiosInstance.get('/sous-categories')
            ]);
            setCategories(catRes.data);
            setSousCategories(sousCatRes.data);
        } catch (err) {
            console.error('Erreur chargement admin', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                if (isSousCategory) {
                    await axiosInstance.put(`/sous-categories/${editing.id}`, { nom: name });
                } else {
                    await axiosInstance.put(`/categories/${editing.id}`, { nom: name });
                }
            } else {
                if (isSousCategory) {
                    await axiosInstance.post('/sous-categories', { nom: name });
                } else {
                    await axiosInstance.post('/categories', { nom: name });
                }
            }
            setModalOpen(false);
            setEditing(null);
            setName('');
            setIsSousCategory(false);
            fetchAll();
        } catch (err) {
            console.error('Erreur sauvegarde', err);
        }
    };

    const handleDelete = async (id, sous = false) => {
        if (window.confirm(`Supprimer cette ${sous ? 'sous-catégorie' : 'catégorie'} ?`)) {
            try {
                if (sous) {
                    await axiosInstance.delete(`/sous-categories/${id}`);
                } else {
                    await axiosInstance.delete(`/categories/${id}`);
                }
                fetchAll();
            } catch (err) {
                console.error('Erreur suppression', err);
            }
        }
    };

    return (
        <div>
            <div className='banner'>
                <h1>Gestion des catégories et sous-catégories</h1>
                <NavAdmin />
            </div>

            <div className={styles.adminSection}>
                <nav className={stylesBack.breadcrumb}>
                    <span className={stylesBack.breadcrumbItem} onClick={() => window.location.href = '/admin'}>Admin</span>
                    <span className={stylesBack.breadcrumbSep}>/</span>
                    <span className={stylesBack.breadcrumbItemActive}>Gestion des catégories</span>
                </nav>

                {/* --- Section Catégories --- */}
                <h2>Catégories</h2>
                <div className={styles.btnContainer}>
                    <button
                        className={`${btnStyles.button} ${btnStyles.btnNew}`}
                        onClick={() => {
                            setModalOpen(true);
                            setEditing(null);
                            setName('');
                            setIsSousCategory(false);
                        }}>
                        Ajouter une catégorie
                    </button>
                </div>
                <ul className={styles.categoryList}>
                    {categories.map(cat => (
                        <li className={styles.categoryItem} key={cat.id}>
                            <span>{cat.nom}</span>
                            <div className={styles.actions}>
                                <button
                                    className={`${btnStyles.button} ${btnStyles.modifier}`}
                                    onClick={() => {
                                        setModalOpen(true);
                                        setEditing(cat);
                                        setName(cat.nom);
                                        setIsSousCategory(false);
                                    }}>
                                    Éditer
                                </button>
                                <button
                                    className={`${btnStyles.button} ${btnStyles.supprimer}`}
                                    onClick={() => handleDelete(cat.id)}>
                                    Supprimer
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                {/* --- Section Sous-catégories --- */}
                <h2>Sous-catégories de packs</h2>
                <div className={styles.btnContainer}>
                    <button
                        className={`${btnStyles.button} ${btnStyles.btnNew}`}
                        onClick={() => {
                            setModalOpen(true);
                            setEditing(null);
                            setName('');
                            setIsSousCategory(true);
                        }}>
                        Ajouter une sous-catégorie
                    </button>
                </div>
                <ul className={styles.categoryList}>
                    {sousCategories.map(sc => (
                        <li className={styles.categoryItem} key={sc.id}>
                            <span>{sc.nom}</span>
                            <div className={styles.actions}>
                                <button
                                    className={`${btnStyles.button} ${btnStyles.modifier}`}
                                    onClick={() => {
                                        setModalOpen(true);
                                        setEditing(sc);
                                        setName(sc.nom);
                                        setIsSousCategory(true);
                                    }}>
                                    Éditer
                                </button>
                                <button
                                    className={`${btnStyles.button} ${btnStyles.supprimer}`}
                                    onClick={() => handleDelete(sc.id, true)}>
                                    Supprimer
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                {/* --- Modale --- */}
                {modalOpen && (
                    <div className={modalStyles.modalOverlay}>
                        <div className={modalStyles.modalContent} style={{ maxWidth: 360 }}>
                            <button className={modalStyles.modalClose} onClick={() => setModalOpen(false)}>
                                &times;
                            </button>
                            <h3 className={modalStyles.modalTitle}>
                                {editing ? (isSousCategory ? "Modifier la sous-catégorie" : "Modifier la catégorie")
                                    : (isSousCategory ? "Nouvelle sous-catégorie" : "Nouvelle catégorie")}
                            </h3>
                            <form onSubmit={handleSubmit}>
                                <label className={modalStyles.modalLabel}>
                                    Nom
                                    <input
                                        className={modalStyles.modalInput}
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Nom"
                                        required
                                        autoFocus
                                    />
                                </label>

                                <div className={modalStyles.modalButtons}>
                                    <button
                                        className={`${btnStyles.button} ${btnStyles.btnNew}`}
                                        type="submit">
                                        {editing ? "Mettre à jour" : "Ajouter"}
                                    </button>
                                    <button
                                        className={`${btnStyles.button} ${btnStyles.btnCancel}`}
                                        type="button"
                                        onClick={() => setModalOpen(false)}>
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
