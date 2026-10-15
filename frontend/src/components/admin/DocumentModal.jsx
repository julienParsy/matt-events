// src/components/admin/DocumentModal.jsx
import React, { useEffect, useState } from 'react';
import { Download, Loader2, Eye, FileCheck2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../../services/axiosInstance';
import Modal from '../ui/Modal';
import { Alert, SubmitButton } from './FormControls';
import { savePdf, openPdf, blobErrorMessage } from '../../utils/pdf';
import ui from '../../styles/components/AdminUI.module.css';

const TYPES = [
    { value: 'devis', label: 'Devis' },
    { value: 'facture', label: 'Facture' },
    { value: 'bonCommande', label: 'Bon de commande' },
];

export default function DocumentModal({ id, closeModal }) {
    const [demande, setDemande] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [previewing, setPreviewing] = useState(false);
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

    const isFacture = typeDoc === 'facture';

    const checkForm = () => {
        if (!adresse.trim()) return 'L’adresse du client est obligatoire.';
        if (typeDoc === 'bonCommande' && !paymentLink.trim()) return 'Le lien de paiement est obligatoire pour un bon de commande.';
        return '';
    };

    const buildBody = () => {
        const body = {
            adresse,
            montage: parseFloat(montage) || 0,
            livraison: parseFloat(livraison) || 0,
            caution: parseFloat(caution) || 0,
            eventDate: demande.event_date || demande.eventDate || null,
        };
        if (typeDoc === 'bonCommande') body.paymentLink = paymentLink.trim();
        return body;
    };

    // Aperçu de la facture (filigrane, sans numéro) : rien n'est enregistré
    const handlePreview = async () => {
        const message = checkForm();
        if (message) { setError(message); return; }
        setError('');
        setPreviewing(true);
        try {
            await openPdf(() => axiosInstance.post(`/demande/${id}/facture?apercu=1`, buildBody(), { responseType: 'blob' }));
        } catch (err) {
            setError(await blobErrorMessage(err, "Impossible de générer l'aperçu."));
        } finally {
            setPreviewing(false);
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const message = checkForm();
        if (message) { setError(message); return; }

        setError('');
        setGenerating(true);
        try {
            const res = await axiosInstance.post(`/demande/${id}/${typeDoc}`, buildBody(), { responseType: 'blob' });
            savePdf(res, `${typeDoc}_${id}.pdf`);

            // Facture déjà émise pour cette demande : retéléchargée à l'identique (les frais saisis ne s'appliquent pas)
            const existante = res.headers?.['x-facture-existante'];
            if (existante) {
                toast.info(`La facture ${existante} existe déjà : elle a été retéléchargée à l'identique. Pour la modifier : Factures › Corriger.`,
                    { autoClose: 8000 });
            }
            closeModal();
        } catch (err) {
            console.error('Erreur génération PDF :', err);
            setError(await blobErrorMessage(err, `Erreur lors de la génération du document (${typeLabel.toLowerCase()}).`));
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

                    {isFacture && (
                        <Alert type="info">
                            Émettre la facture lui attribue un numéro définitif. Vérifiez-la d’abord avec « Aperçu ».
                            Si une facture existe déjà pour cette demande, elle est retéléchargée telle quelle.
                        </Alert>
                    )}

                    <div className={ui.formActions}>
                        <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={closeModal}>
                            Annuler
                        </button>
                        {isFacture && (
                            <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={handlePreview} disabled={previewing}>
                                <Eye size={17} aria-hidden="true" /> {previewing ? 'Aperçu…' : 'Aperçu'}
                            </button>
                        )}
                        <SubmitButton loading={generating} loadingLabel="Génération…" icon={isFacture ? FileCheck2 : Download}>
                            {isFacture ? 'Émettre la facture' : `Télécharger : ${typeLabel.toLowerCase()}`}
                        </SubmitButton>
                    </div>
                </form>
            )}
        </Modal>
    );
}
