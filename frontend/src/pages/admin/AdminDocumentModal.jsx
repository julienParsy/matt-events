// src/pages/admin/AdminDocumentModal.jsx
import React, { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import Modal from '../../components/Modal/Modal';
import { Alert, SubmitButton } from '../../components/admin/FormControls';
import ui from '../../styles/components/AdminUI.module.css';

const TYPES = [
    { value: 'devis', label: 'Devis' },
    { value: 'facture', label: 'Facture' },
    { value: 'bonCommande', label: 'Bon de commande' },
];

export default function AdminDocumentModal({ id, closeModal }) {
    const [demande, setDemande] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [adresse, setAdresse] = useState('');
    const [montage, setMontage] = useState(0);
    const [livraison, setLivraison] = useState(0);
    const [caution, setCaution] = useState(0);
    const [paymentLink, setPaymentLink] = useState('');
    const [typeDoc, setTypeDoc] = useState('devis');

    useEffect(() => {
        const fetchDemande = async () => {
            try {
                const res = await axiosInstance.get(`/demande/${id}`);
                setDemande(res.data);
                setAdresse(res.data.adresse || '');
            } catch (err) {
                console.error('Erreur récupération de la demande :', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDemande();
    }, [id]);

    const typeLabel = TYPES.find(t => t.value === typeDoc)?.label || typeDoc;

    const handleSubmit = async e => {
        e.preventDefault();
        if (!adresse.trim()) { setError('L’adresse du client est obligatoire.'); return; }
        if (typeDoc === 'bonCommande' && !paymentLink.trim()) { setError('Le lien de paiement est obligatoire pour un bon de commande.'); return; }

        setError('');
        setGenerating(true);
        try {
            const body = {
                adresse,
                montage: parseFloat(montage) || 0,
                livraison: parseFloat(livraison) || 0,
                caution: parseFloat(caution) || 0,
                eventDate: demande.event_date || demande.eventDate || null,
            };
            if (typeDoc === 'bonCommande') body.paymentLink = paymentLink.trim();

            const res = await axiosInstance.post(`/demande/${id}/${typeDoc}`, body, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${typeDoc}_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);

            closeModal();
        } catch (err) {
            console.error('Erreur génération PDF :', err);
            setError(`Erreur lors de la génération du document (${typeLabel.toLowerCase()}).`);
        } finally {
            setGenerating(false);
        }
    };

    const client = demande ? `${demande.prenom || ''} ${demande.nom || ''}`.trim() : '';

    return (
        <Modal
            isOpen
            size="md"
            title="Générer un document"
            subtitle={client ? `Demande n° ${id} — ${client}` : `Demande n° ${id}`}
            onClose={closeModal}
        >
            {loading ? (
                <p className={ui.hint}><Loader2 size={16} className={ui.spin} aria-hidden="true" /> Chargement de la demande…</p>
            ) : !demande ? (
                <Alert>Demande introuvable.</Alert>
            ) : (
                <form onSubmit={handleSubmit} className={ui.form} noValidate>
                    <Alert>{error}</Alert>

                    <div className={ui.field}>
                        <span className={ui.label} id="doc-type-label">Type de document</span>
                        <div className={ui.segmented} role="radiogroup" aria-labelledby="doc-type-label">
                            {TYPES.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={typeDoc === t.value}
                                    className={`${ui.segment} ${typeDoc === t.value ? ui.segmentActive : ''}`}
                                    onClick={() => setTypeDoc(t.value)}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={ui.field}>
                        <label className={ui.label} htmlFor="doc-adresse">Adresse du client</label>
                        <input id="doc-adresse" className={ui.input} type="text" value={adresse}
                            onChange={e => setAdresse(e.target.value)} placeholder="N°, rue, code postal, ville" />
                    </div>

                    <div className={ui.row}>
                        <div className={ui.field}>
                            <label className={ui.label} htmlFor="doc-montage">Montage / démontage (€)</label>
                            <input id="doc-montage" className={ui.input} type="number" min={0} step={0.01}
                                inputMode="decimal" value={montage} onChange={e => setMontage(e.target.value)} />
                        </div>
                        <div className={ui.field}>
                            <label className={ui.label} htmlFor="doc-livraison">Livraison (€)</label>
                            <input id="doc-livraison" className={ui.input} type="number" min={0} step={0.01}
                                inputMode="decimal" value={livraison} onChange={e => setLivraison(e.target.value)} />
                        </div>
                    </div>

                    <div className={ui.field}>
                        <label className={ui.label} htmlFor="doc-caution">Caution (€)</label>
                        <input id="doc-caution" className={ui.input} type="number" min={0} step={0.01}
                            inputMode="decimal" value={caution} onChange={e => setCaution(e.target.value)} />
                    </div>

                    {typeDoc === 'bonCommande' && (
                        <div className={ui.field}>
                            <label className={ui.label} htmlFor="doc-payment">Lien de paiement</label>
                            <input id="doc-payment" className={ui.input} type="url" value={paymentLink}
                                onChange={e => setPaymentLink(e.target.value)} placeholder="https://…" />
                        </div>
                    )}

                    <div className={ui.formActions}>
                        <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={closeModal}>
                            Annuler
                        </button>
                        <SubmitButton loading={generating} loadingLabel="Génération…" icon={Download}>
                            Télécharger : {typeLabel.toLowerCase()}
                        </SubmitButton>
                    </div>
                </form>
            )}
        </Modal>
    );
}
