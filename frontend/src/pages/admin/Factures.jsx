// src/pages/admin/Factures.jsx
// Factures et avoirs émis : retéléchargement à l'identique, correction (avoir + nouvelle facture), annulation par avoir.
import React, { useEffect, useMemo, useState } from 'react';
import { Receipt, Download, PencilLine, Ban, Search, Loader2, FileCheck2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../../services/axiosInstance';
import AdminHeader from '../../components/admin/AdminHeader';
import FactureEditor from '../../components/admin/FactureEditor';
import Modal from '../../components/Modal/Modal';
import { Alert } from '../../components/admin/FormControls';
import { savePdf, blobErrorMessage } from '../../utils/pdf';
import { formatPrice } from '../../utils/cart';
import ui from '../../styles/components/AdminUI.module.css';
import tableStyles from '../../styles/pages/AdminDemandes.module.css';

const FILTRES = [
    { value: 'toutes', label: 'Tout' },
    { value: 'factures', label: 'Factures en cours' },
    { value: 'annulees', label: 'Factures annulées' },
    { value: 'avoirs', label: 'Avoirs' },
];

const match = (doc, filtre) => {
    if (filtre === 'factures') return doc.type === 'facture' && doc.statut === 'emise';
    if (filtre === 'annulees') return doc.type === 'facture' && doc.statut === 'annulee';
    if (filtre === 'avoirs') return doc.type === 'avoir';
    return true;
};

const formatDate = value => (value ? new Date(value).toLocaleDateString('fr-FR') : '—');

function StatutTag({ doc }) {
    if (doc.type === 'avoir') return <span className={`${ui.tag} ${ui.tagWarning}`}>Avoir</span>;
    if (doc.statut === 'annulee') return <span className={`${ui.tag} ${ui.tagDanger}`}>Annulée</span>;
    return <span className={`${ui.tag} ${ui.tagSuccess}`}>Émise</span>;
}

export default function AdminFactures() {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [filtre, setFiltre] = useState('toutes');
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState(null);   // facture complète en cours de correction
    const [result, setResult] = useState(null);     // documents créés à proposer au téléchargement
    const [busyId, setBusyId] = useState(null);

    useEffect(() => { fetchDocs(); }, []);

    const fetchDocs = async () => {
        try {
            const { data } = await axiosInstance.get('/factures');
            setDocs(data);
            setLoadError('');
        } catch (err) {
            const status = err.response?.status;
            setLoadError(
                status === 404
                    ? "Le serveur ne connaît pas encore la gestion des factures : il doit être redémarré ou redéployé avec la dernière version."
                    : !err.response
                        ? 'Serveur injoignable. Vérifiez que le backend est démarré.'
                        : err.response.data?.message || `Impossible de charger les factures (erreur ${status}).`
            );
        } finally {
            setLoading(false);
        }
    };

    const q = search.trim().toLowerCase();
    const filtered = useMemo(() => docs.filter(d => match(d, filtre) && (!q
        || d.numero.toLowerCase().includes(q)
        || (d.client || '').toLowerCase().includes(q)
        || String(d.demandeId || '').includes(q))), [docs, filtre, q]);
    const countFor = value => docs.filter(d => match(d, value)).length;

    const download = async doc => {
        setBusyId(doc.id);
        try {
            const res = await axiosInstance.get(`/factures/${doc.id}/pdf`, { responseType: 'blob' });
            savePdf(res, `${doc.type}_${doc.numero}.pdf`);
        } catch (err) {
            toast.error(await blobErrorMessage(err, 'Téléchargement impossible.'));
        } finally {
            setBusyId(null);
        }
    };

    const startCorrection = async doc => {
        setBusyId(doc.id);
        try {
            const { data } = await axiosInstance.get(`/factures/${doc.id}`);
            setEditing(data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Impossible de charger la facture.');
        } finally {
            setBusyId(null);
        }
    };

    const cancel = async doc => {
        if (!window.confirm(
            `Annuler la facture ${doc.numero} ?\n\nUn avoir du même montant sera émis. La facture restera visible, avec le statut « annulée ».`
        )) return;
        setBusyId(doc.id);
        try {
            const { data } = await axiosInstance.post(`/factures/${doc.id}/annuler`);
            setResult({ titre: `Facture ${doc.numero} annulée`, documents: [{ ...data.avoir, type: 'avoir' }] });
            fetchDocs();
        } catch (err) {
            toast.error(err.response?.data?.message || "L'annulation a échoué.");
        } finally {
            setBusyId(null);
        }
    };

    const onCorrected = data => {
        const ancien = editing?.numero;
        setEditing(null);
        setResult({
            titre: `Facture ${ancien} corrigée`,
            documents: [{ ...data.avoir, type: 'avoir' }, { ...data.facture, type: 'facture' }],
        });
        fetchDocs();
    };

    const enCours = countFor('factures');

    return (
        <div>
            <AdminHeader
                icon={Receipt}
                title="Factures"
                subtitle={loading ? 'Chargement…' : `${enCours} facture${enCours > 1 ? 's' : ''} en cours · ${countFor('avoirs')} avoir${countFor('avoirs') > 1 ? 's' : ''}`}
            />

            <div className={ui.page}>
                <section className={ui.panel}>
                    <Alert type="info">
                        Une facture émise ne se modifie pas : « Corriger » l'annule par un avoir et émet une nouvelle facture,
                        « Annuler » émet seulement l'avoir. Les numéros se suivent sans trou, comme l'exige la loi.
                    </Alert>

                    <div className={ui.toolbar} style={{ marginTop: '1rem' }}>
                        <div className={ui.segmented} role="tablist" aria-label="Filtrer les documents">
                            {FILTRES.map(f => (
                                <button key={f.value} type="button" role="tab" aria-selected={filtre === f.value}
                                    className={`${ui.segment} ${filtre === f.value ? ui.segmentActive : ''}`}
                                    onClick={() => setFiltre(f.value)}>
                                    {f.label} <span className={ui.count}>{countFor(f.value)}</span>
                                </button>
                            ))}
                        </div>
                        <div className={ui.inputWrap} style={{ minWidth: 220 }}>
                            <input className={ui.input} type="search" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="N°, client ou demande…" aria-label="Rechercher une facture" style={{ paddingRight: '2.5rem' }} />
                            <Search size={16} aria-hidden="true" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        </div>
                    </div>

                    {loadError && <Alert>{loadError}</Alert>}

                    {loading ? (
                        <p className={ui.hint}><Loader2 size={16} className={ui.spin} aria-hidden="true" /> Chargement…</p>
                    ) : filtered.length === 0 ? (
                        <p className={ui.empty}>
                            {docs.length === 0
                                ? 'Aucune facture pour le moment. Elles se créent depuis « Demandes », bouton « Devis / facture / bon de commande ».'
                                : 'Aucun document ne correspond.'}
                        </p>
                    ) : (
                        <div className={`${ui.tableWrap} ${tableStyles.tableWrap}`}>
                            <table className={`${ui.table} ${tableStyles.table}`}>
                                <thead>
                                    <tr>
                                        <th>Numéro</th>
                                        <th>Date</th>
                                        <th>Client</th>
                                        <th>Montant</th>
                                        <th>Statut</th>
                                        <th className={tableStyles.thActions}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(doc => (
                                        <tr key={doc.id}>
                                            <td data-label="Numéro" className={ui.cellStrong}>
                                                <div className={tableStyles.value}>
                                                    {doc.numero}
                                                    {doc.type === 'avoir' && doc.origineNumero && (
                                                        <span className={`${ui.cellMuted} ${tableStyles.ref}`}>annule {doc.origineNumero}</span>
                                                    )}
                                                    {doc.type === 'facture' && doc.origineNumero && (
                                                        <span className={`${ui.cellMuted} ${tableStyles.ref}`}>remplace {doc.origineNumero}</span>
                                                    )}
                                                    {doc.remplaceePar && (
                                                        <span className={`${ui.cellMuted} ${tableStyles.ref}`}>remplacée par {doc.remplaceePar}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td data-label="Date" className={ui.cellMuted}>{formatDate(doc.date)}</td>
                                            <td data-label="Client">
                                                <div className={tableStyles.value}>
                                                    {doc.client || '—'}
                                                    {doc.demandeId && <span className={`${ui.cellMuted} ${tableStyles.ref}`}>demande n° {doc.demandeId}</span>}
                                                </div>
                                            </td>
                                            <td data-label="Montant" className={ui.cellStrong}>{doc.total !== null ? formatPrice(doc.total) : '—'}</td>
                                            <td data-label="Statut"><StatutTag doc={doc} /></td>
                                            <td className={tableStyles.cellActions}>
                                                <div className={ui.listActions}>
                                                    <button type="button" className={ui.iconBtn} onClick={() => download(doc)} disabled={busyId === doc.id}
                                                        title="Télécharger" aria-label={`Télécharger ${doc.numero}`}>
                                                        {busyId === doc.id ? <Loader2 size={16} className={ui.spin} /> : <Download size={16} />}
                                                    </button>
                                                    {doc.modifiable && (
                                                        <>
                                                            <button type="button" className={ui.iconBtn} onClick={() => startCorrection(doc)} disabled={busyId === doc.id}
                                                                title="Corriger (avoir + nouvelle facture)" aria-label={`Corriger ${doc.numero}`}>
                                                                <PencilLine size={16} />
                                                            </button>
                                                            <button type="button" className={`${ui.iconBtn} ${ui.iconBtnDanger}`} onClick={() => cancel(doc)} disabled={busyId === doc.id}
                                                                title="Annuler par un avoir" aria-label={`Annuler ${doc.numero}`}>
                                                                <Ban size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {editing && <FactureEditor facture={editing} onClose={() => setEditing(null)} onDone={onCorrected} />}

            {result && (
                <Modal isOpen size="sm" title={result.titre} subtitle="Documents émis, à transmettre au client." onClose={() => setResult(null)}>
                    <div className={ui.form}>
                        <ul className={ui.list}>
                            {result.documents.map(d => (
                                <li key={d.id} className={ui.listItem}>
                                    <FileCheck2 size={18} aria-hidden="true" />
                                    <span className={ui.listMain}>{d.type === 'avoir' ? 'Avoir' : 'Facture'} {d.numero}</span>
                                    <button type="button" className={`${ui.btn} ${ui.btnSecondary} ${ui.btnSmall}`} onClick={() => download(d)}>
                                        <Download size={15} aria-hidden="true" /> Télécharger
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className={ui.formActions}>
                            <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => setResult(null)}>Terminé</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
