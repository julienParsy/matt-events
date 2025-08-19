import React, { useState, useEffect } from 'react';
import axiosInstance from '../../services/axiosInstance';
import NavAdmin from './NavAdmin';
import btnStyles from '../../styles/components/Button.module.css';
import modalStyles from '../../styles/components/Modal.module.css'; // Pour la modale
import styles from '../../styles/pages/AdminCategories.module.css';
import stylesBack from '../../styles/components/BackButton.module.css'; // Pour le bouton de retour

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const res = await axiosInstance.get('/categories');
        setCategories(res.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editing) {
            await axiosInstance.put(`/categories/${editing.id}`, { nom: name });
        } else {
            await axiosInstance.post('/categories', { nom: name });
        }
        setModalOpen(false);
        setName('');
        setEditing(null);
        fetchCategories();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Supprimer cette catégorie ?')) {
            await axiosInstance.delete(`/categories/${id}`);
            fetchCategories();
        }
    };

    return (
        <div>

            <div className='banner'>
                <h1>Gestion des catégories</h1>
            <NavAdmin />
        </div>
        <div className={`${styles.adminSection}`}>
            <nav className={stylesBack.breadcrumb}>
                <span className={stylesBack.breadcrumbItem} onClick={() => window.location.href = '/admin'}>Admin</span>
                <span className={stylesBack.breadcrumbSep}>/</span>
                <span className={stylesBack.breadcrumbItemActive}>Gestion des catégories</span>
            </nav>
                <div className={styles.btnContainer}>
            <button
                className={`${btnStyles.button} ${btnStyles.btnNew}`}
                onClick={() => {
                    setModalOpen(true);
                    setEditing(null);
                    setName('');
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
            {modalOpen && (
                <div className={modalStyles.modalOverlay}>
                    <div className={modalStyles.modalContent} style={{ maxWidth: 360 }}>
                        <button className={modalStyles.modalClose} onClick={() => setModalOpen(false)}>
                            &times;
                        </button>
                        <h3 className={modalStyles.modalTitle}>
                            {editing ? "Modifier la catégorie" : "Nouvelle catégorie"}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <label className={modalStyles.modalLabel}>
                                Nom de la catégorie
                                <input
                                    className={modalStyles.modalInput}
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Nom catégorie"
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
