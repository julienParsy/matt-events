import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom'; // ✅ Ajout pour le lien
import axiosInstance from '../../services/axiosInstance';
import NavAdmin from './NavAdmin';
import btnStyles from '../../styles/components/Button.module.css';
import modalStyles from '../../styles/components/Modal.module.css';
import styles from '../../styles/pages/AdminDemandes.module.css';
import stylesBack from '../../styles/components/BackButton.module.css';
import { AuthContext } from "../../contexts/AuthContext";

export default function AdminDemandes() {
    const [demandes, setDemandes] = useState([]);
    const [filtre, setFiltre] = useState('toutes');
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const { user, token } = useContext(AuthContext);

    const generatePDF = async (id) => {
        try {
            const response = await axiosInstance.get(`/demande/${id}/pdf`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch {
            alert("Erreur lors de la génération du PDF");
        }
    };

    useEffect(() => {
        if (token && user && user.role === "admin") {
            fetchDemandes();
        }
    }, [user, token]);

    const fetchDemandes = async () => {
        try {
            const res = await axiosInstance.get('/demande');
            setDemandes(res.data);
        } catch (err) {
            console.error("Erreur fetch demandes:", err);
        }
    };

    const updateStatut = async (id, statut) => {
        await axiosInstance.put(`/demande/${id}`, { statut });
        fetchDemandes();
    };

    const supprimer = async (id) => {
        if (window.confirm('Supprimer cette demande ?')) {
            await axiosInstance.delete(`/demande/${id}`);
            fetchDemandes();
        }
    };

    const supprimerSelection = async () => {
        if (window.confirm('Supprimer les demandes sélectionnées ?')) {
            await Promise.all(selectedIds.map(id => axiosInstance.delete(`/demande/${id}`)));
            fetchDemandes();
            setSelectedIds([]);
            setSelectAll(false);
        }
    };

    const supprimerToutes = async () => {
        if (window.confirm('Supprimer toutes les demandes ?')) {
            await Promise.all(filtered.map(d => axiosInstance.delete(`/demande/${d.id}`)));
            fetchDemandes();
            setSelectedIds([]);
            setSelectAll(false);
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map(d => d.id));
        }
        setSelectAll(!selectAll);
    };

    const filtered = demandes.filter(d =>
        filtre === 'toutes' ? true : d.statut === filtre
    );

    return (
        <div>
            <div className='banner'>
            <h1 >Gestion des demandes</h1>
                <NavAdmin />
            </div>

            <div className={`${styles.adminSection}`}>
                <nav className={stylesBack.breadcrumb}>
                    <span className={stylesBack.breadcrumbItem} onClick={() => window.location.href = '/admin'}>Admin</span>
                    <span className={stylesBack.breadcrumbSep}>/</span>
                    <span className={stylesBack.breadcrumbItemActive}>Gestion des demandes</span>
                </nav>

                <select
                    className={modalStyles.modalSelect}
                    value={filtre}
                    onChange={e => setFiltre(e.target.value)}
                >
                    <option value="toutes">Toutes</option>
                    <option value="en_attente">En attente</option>
                    <option value="traitée">Traitée</option>
                    <option value="refusée">Refusée</option>
                </select>

                {selectedIds.length > 0 && (
                    <button className={`${btnStyles.button} ${btnStyles.supprimer}`} onClick={supprimerSelection}>
                        Supprimer les {selectedIds.length} sélectionnées
                    </button>
                )}

                <button className={`${btnStyles.button} ${btnStyles.supprimer}`} onClick={supprimerToutes}>
                    Supprimer toutes les demandes
                </button>

                <div className={styles.container}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th><input type="checkbox" onChange={toggleSelectAll} checked={selectAll} /></th>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Téléphone</th>
                                <th>Date</th>
                                <th>PDF</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(d => (
                                <tr key={d.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(d.id)}
                                            onChange={() => toggleSelect(d.id)}
                                        />
                                    </td>
                                    <td>{d.prenom} {d.nom}</td>
                                    <td>{d.email}</td>
                                    <td>{d.telephone}</td>
                                    <td>{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                                    <td>
                                    <button
                                        className={btnStyles.linkBtn}
                                        onClick={() => generatePDF(d.id)}
                                    >
                                        Générer la demande {d.id}
                                    </button>
                                    <br />
                                    <Link
                                        to={`/admin/demande/${d.id}/devis`}
                                        className={btnStyles.linkBtn}
                                    >
                                        Générer devis/facture
                                    </Link>
                                </td>
                                    <td>
                                        <span className={`${styles.statut} ${styles[d.statut]}`}>
                                            {d.statut}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            {d.statut !== 'traitée' && (
                                                <button
                                                    className={`${btnStyles.button} ${btnStyles.modifier}`}
                                                    onClick={() => updateStatut(d.id, 'traitée')}
                                                >
                                                    Valider
                                                </button>
                                            )}
                                            {d.statut !== 'refusée' && (
                                                <button
                                                    className={`${btnStyles.button} ${btnStyles.supprimer}`}
                                                    onClick={() => updateStatut(d.id, 'refusée')}
                                                >
                                                    Refuser
                                                </button>
                                            )}
                                            <button
                                                className={`${btnStyles.button} ${btnStyles.supprimer}`}
                                                onClick={() => supprimer(d.id)}
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
