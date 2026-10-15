// @feature demandes — Admin : liste et suivi des demandes
import React, { useEffect, useState, useContext } from 'react';
import {
    Inbox, FileText, FileSignature, Check, X, Trash2, RotateCcw, Mail, Phone,
} from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../../services/axiosInstance';
import { AuthContext } from '../../contexts/AuthContext';
import AdminHeader from '../../components/admin/AdminHeader';
import DocumentModal from '../../components/admin/DocumentModal';
import { Alert } from '../../components/admin/FormControls';
import ui from '../../styles/components/AdminUI.module.css';
import styles from '../../styles/pages/AdminDemandesPage.module.css';

const STATUTS = {
    en_attente: { label: 'En attente', tag: ui.tagWarning },
    traitée: { label: 'Traitée', tag: ui.tagSuccess },
    refusée: { label: 'Refusée', tag: ui.tagDanger },
};

const FILTRES = [
    { value: 'toutes', label: 'Toutes' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'traitée', label: 'Traitées' },
    { value: 'refusée', label: 'Refusées' },
];

const formatDate = value => (value ? new Date(value).toLocaleDateString('fr-FR') : '—');

export default function AdminDemandesPage() {
    const [demandes, setDemandes] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [filtre, setFiltre] = useState('toutes');
    const [selectedIds, setSelectedIds] = useState([]);
    const [documentFor, setDocumentFor] = useState(null);
    const { user, token } = useContext(AuthContext);
    const canLoad = !!token && ['admin', 'superadmin'].includes(user?.role);

    useEffect(() => {
        if (canLoad) fetchDemandes();
    }, [canLoad]);

    const fetchDemandes = async () => {
        try {
            const res = await axiosInstance.get('/demande');
            setDemandes(res.data);
            setLoadError('');
        } catch (err) {
            console.error('Erreur fetch demandes:', err);
            setLoadError('Impossible de charger les demandes.');
        }
    };

    const filtered = demandes.filter(d => filtre === 'toutes' || d.statut === filtre);
    const countFor = value => (value === 'toutes' ? demandes.length : demandes.filter(d => d.statut === value).length);
    const allSelected = filtered.length > 0 && filtered.every(d => selectedIds.includes(d.id));

    const changeFiltre = value => {
        setFiltre(value);
        setSelectedIds([]); // la sélection ne doit pas viser des lignes masquées
    };

    const updateStatut = async (id, statut) => {
        try {
            await axiosInstance.put(`/demande/${id}`, { statut });
            fetchDemandes();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Impossible de changer le statut.');
        }
    };

    const deleteIds = async (ids, question) => {
        if (!ids.length || !window.confirm(question)) return;
        const results = await Promise.allSettled(ids.map(id => axiosInstance.delete(`/demande/${id}`)));
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed) toast.error(`${failed} suppression(s) ont échoué.`);
        else toast.success(ids.length > 1 ? `${ids.length} demandes supprimées.` : 'Demande supprimée.');
        setSelectedIds([]);
        fetchDemandes();
    };

    const toggleSelect = id => setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
    const toggleSelectAll = () => setSelectedIds(allSelected ? [] : filtered.map(d => d.id));

    const handleDemandePDF = async id => {
        try {
            const res = await axiosInstance.get(`/demande/${id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch (err) {
            console.error('Erreur génération PDF demande :', err.response || err);
            toast.error('Erreur lors de la génération du PDF de la demande.');
        }
    };

    const pending = countFor('en_attente');
    const filtreLabel = FILTRES.find(f => f.value === filtre)?.label.toLowerCase();

    return (
        <div>
            <AdminHeader
                icon={Inbox}
                title="Demandes"
                subtitle={pending > 0
                    ? `${pending} demande${pending > 1 ? 's' : ''} en attente de traitement`
                    : 'Aucune demande en attente'}
            />

            <div className={ui.page}>
                <section className={ui.panel}>
                    <div className={ui.toolbar}>
                        <div className={ui.segmented} role="tablist" aria-label="Filtrer par statut">
                            {FILTRES.map(f => (
                                <button
                                    key={f.value}
                                    type="button"
                                    role="tab"
                                    aria-selected={filtre === f.value}
                                    className={`${ui.segment} ${filtre === f.value ? ui.segmentActive : ''}`}
                                    onClick={() => changeFiltre(f.value)}
                                >
                                    {f.label} <span className={ui.count}>{countFor(f.value)}</span>
                                </button>
                            ))}
                        </div>

                        <div className={ui.headerActions}>
                            {selectedIds.length > 0 ? (
                                <button
                                    type="button"
                                    className={`${ui.btn} ${ui.btnDanger} ${ui.btnSmall}`}
                                    onClick={() => deleteIds(selectedIds, `Supprimer les ${selectedIds.length} demandes sélectionnées ?`)}
                                >
                                    <Trash2 size={15} aria-hidden="true" /> Supprimer la sélection ({selectedIds.length})
                                </button>
                            ) : filtered.length > 0 && (
                                <button
                                    type="button"
                                    className={`${ui.btn} ${ui.btnDanger} ${ui.btnSmall}`}
                                    onClick={() => deleteIds(
                                        filtered.map(d => d.id),
                                        filtre === 'toutes'
                                            ? `Supprimer les ${filtered.length} demandes ?`
                                            : `Supprimer les ${filtered.length} demandes « ${filtreLabel} » ?`
                                    )}
                                >
                                    <Trash2 size={15} aria-hidden="true" />
                                    {filtre === 'toutes' ? 'Tout supprimer' : `Supprimer les ${filtreLabel}`}
                                </button>
                            )}
                        </div>
                    </div>

                    {loadError && <Alert>{loadError}</Alert>}

                    {filtered.length === 0 ? (
                        <p className={ui.empty}>
                            {filtre === 'toutes' ? 'Aucune demande pour le moment.' : `Aucune demande « ${filtreLabel} ».`}
                        </p>
                    ) : (
                        <div className={`${ui.tableWrap} ${styles.tableWrap}`}>
                            <table className={`${ui.table} ${styles.table}`}>
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                className={ui.checkbox}
                                                checked={allSelected}
                                                onChange={toggleSelectAll}
                                                aria-label="Tout sélectionner"
                                            />
                                        </th>
                                        <th>Client</th>
                                        <th>Contact</th>
                                        <th>Reçue le</th>
                                        <th>Statut</th>
                                        <th className={styles.thActions}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(d => {
                                        const statut = STATUTS[d.statut] || { label: d.statut, tag: ui.tagNeutral };
                                        const selected = selectedIds.includes(d.id);
                                        return (
                                            <tr key={d.id} className={selected ? ui.rowSelected : ''}>
                                                <td className={styles.cellCheck}>
                                                    <input
                                                        type="checkbox"
                                                        className={ui.checkbox}
                                                        checked={selected}
                                                        onChange={() => toggleSelect(d.id)}
                                                        aria-label={`Sélectionner la demande de ${d.prenom} ${d.nom}`}
                                                    />
                                                </td>
                                                <td data-label="Client" className={ui.cellStrong}>
                                                    <div className={styles.value}>
                                                        {d.prenom} {d.nom}
                                                        <span className={`${ui.cellMuted} ${styles.ref}`}>n° {d.id}</span>
                                                    </div>
                                                </td>
                                                <td data-label="Contact">
                                                    <div className={styles.value}>
                                                        <a className={styles.contact} href={`mailto:${d.email}`}>
                                                            <Mail size={14} aria-hidden="true" /> {d.email}
                                                        </a>
                                                        {d.telephone && (
                                                            <a className={styles.contact} href={`tel:${d.telephone}`}>
                                                                <Phone size={14} aria-hidden="true" /> {d.telephone}
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td data-label="Reçue le" className={ui.cellMuted}>{formatDate(d.created_at)}</td>
                                                <td data-label="Statut">
                                                    <span className={`${ui.tag} ${statut.tag}`}>{statut.label}</span>
                                                </td>
                                                <td className={styles.cellActions}>
                                                    <div className={ui.listActions}>
                                                        <button type="button" className={ui.iconBtn} onClick={() => handleDemandePDF(d.id)}
                                                            title="Voir la demande (PDF)" aria-label={`Voir la demande n° ${d.id} en PDF`}>
                                                            <FileText size={16} />
                                                        </button>
                                                        <button type="button" className={ui.iconBtn} onClick={() => setDocumentFor(d.id)}
                                                            title="Devis / facture / bon de commande" aria-label={`Générer un document pour la demande n° ${d.id}`}>
                                                            <FileSignature size={16} />
                                                        </button>
                                                        {d.statut !== 'traitée' && (
                                                            <button type="button" className={`${ui.iconBtn} ${styles.ok}`} onClick={() => updateStatut(d.id, 'traitée')}
                                                                title="Marquer comme traitée" aria-label={`Marquer la demande n° ${d.id} comme traitée`}>
                                                                <Check size={16} />
                                                            </button>
                                                        )}
                                                        {d.statut !== 'refusée' && (
                                                            <button type="button" className={`${ui.iconBtn} ${styles.ko}`} onClick={() => updateStatut(d.id, 'refusée')}
                                                                title="Refuser" aria-label={`Refuser la demande n° ${d.id}`}>
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                        {d.statut !== 'en_attente' && (
                                                            <button type="button" className={ui.iconBtn} onClick={() => updateStatut(d.id, 'en_attente')}
                                                                title="Remettre en attente" aria-label={`Remettre la demande n° ${d.id} en attente`}>
                                                                <RotateCcw size={16} />
                                                            </button>
                                                        )}
                                                        <button type="button" className={`${ui.iconBtn} ${ui.iconBtnDanger}`}
                                                            onClick={() => deleteIds([d.id], `Supprimer la demande de ${d.prenom} ${d.nom} ?`)}
                                                            title="Supprimer" aria-label={`Supprimer la demande n° ${d.id}`}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {documentFor !== null && (
                <DocumentModal id={documentFor} closeModal={() => setDocumentFor(null)} />
            )}
        </div>
    );
}
