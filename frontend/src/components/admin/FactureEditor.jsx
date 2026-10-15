// @feature factures
// Correction d'une facture : formulaire pré-rempli. À la validation, le serveur émet
// un avoir qui annule l'ancienne facture et une nouvelle facture avec ce contenu.
import { useMemo, useState } from 'react';
import { Plus, Trash2, Eye, FileCheck2, User, CalendarDays, ListOrdered, Receipt } from 'lucide-react';
import Modal from '../ui/Modal';
import { Alert, SubmitButton } from './FormControls';
import axiosInstance from '../../services/axiosInstance';
import { openPdf, blobErrorMessage } from '../../utils/pdf';
import { formatPrice } from '../../utils/cart';
import ui from '../../styles/components/AdminUI.module.css';
import styles from '../../styles/components/FactureEditor.module.css';

const toNum = v => {
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
};

const emptyLine = () => ({ nom: '', modele: '', prix: '', quantite: 1, type: 'produit' });

export default function FactureEditor({ facture, onClose, onDone }) {
    const c = facture.contenu || {};
    const [client, setClient] = useState({
        prenom: c.client?.prenom || '', nom: c.client?.nom || '', email: c.client?.email || '',
        telephone: c.client?.telephone || '', adresse: c.client?.adresse || '',
    });
    const [eventDate, setEventDate] = useState(c.eventDate || '');
    const [deliveryType, setDeliveryType] = useState(c.deliveryType || 'pickup');
    const [lignes, setLignes] = useState((c.produits || []).map(p => ({ ...p, prix: String(p.prix ?? ''), quantite: p.quantite ?? 1 })));
    const [frais, setFrais] = useState({
        montage: String(c.frais?.montage || ''), livraison: String(c.frais?.livraison || ''), caution: String(c.frais?.caution || ''),
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [previewing, setPreviewing] = useState(false);

    const totals = useMemo(() => {
        const materiel = lignes.reduce((sum, l) => sum + toNum(l.prix) * Math.max(1, Math.round(toNum(l.quantite) || 1)), 0);
        return { materiel, total: materiel + toNum(frais.montage) + toNum(frais.livraison) };
    }, [lignes, frais]);

    const contenu = () => ({
        client,
        eventDate: eventDate || null,
        deliveryType,
        produits: lignes.map(l => ({ ...l, prix: toNum(l.prix), quantite: Math.max(1, Math.round(toNum(l.quantite) || 1)) })),
        frais: { montage: toNum(frais.montage), livraison: toNum(frais.livraison), caution: toNum(frais.caution) },
        demandeNumero: c.demandeNumero,
    });

    const updateLine = (i, field, value) => setLignes(list => list.map((l, j) => (j === i ? { ...l, [field]: value } : l)));
    const removeLine = i => setLignes(list => list.filter((_, j) => j !== i));

    const validate = () => {
        if (!client.nom.trim() && !client.prenom.trim()) return 'Le nom du client est obligatoire.';
        if (!lignes.length) return 'La facture doit contenir au moins une ligne.';
        const bad = lignes.findIndex(l => !String(l.nom).trim());
        if (bad !== -1) return `Ligne ${bad + 1} : la désignation est obligatoire.`;
        return '';
    };

    const preview = async () => {
        const message = validate();
        if (message) { setError(message); return; }
        setError('');
        setPreviewing(true);
        try {
            await openPdf(() => axiosInstance.post('/factures/apercu', contenu(), { responseType: 'blob' }));
        } catch (err) {
            setError(await blobErrorMessage(err, "Impossible de générer l'aperçu."));
        } finally {
            setPreviewing(false);
        }
    };

    const submit = async e => {
        e.preventDefault();
        const message = validate();
        if (message) { setError(message); return; }
        if (!window.confirm(
            `La facture ${facture.numero} va être annulée par un avoir, et une nouvelle facture corrigée sera émise.\n\nContinuer ?`
        )) return;
        setError('');
        setSaving(true);
        try {
            const { data } = await axiosInstance.post(`/factures/${facture.id}/corriger`, contenu());
            onDone(data);
        } catch (err) {
            setError(err.response?.data?.message || 'La correction a échoué.');
        } finally {
            setSaving(false);
        }
    };

    const setClientField = field => e => setClient(prev => ({ ...prev, [field]: e.target.value }));
    const setFraisField = field => e => setFrais(prev => ({ ...prev, [field]: e.target.value }));

    return (
        <Modal isOpen size="lg" title={`Corriger la facture ${facture.numero.replace(/-/g, '‑')}`}
            subtitle="Un avoir annulera cette facture et une nouvelle facture sera émise." onClose={onClose}>
            <form onSubmit={submit} className={ui.form} noValidate>
                <Alert>{error}</Alert>

                {/* Client */}
                <fieldset className={styles.group}>
                    <legend className={styles.legend}><User size={16} aria-hidden="true" /> Client</legend>
                    <div className={ui.row}>
                        <div className={ui.field}>
                            <label className={ui.label} htmlFor="fe-prenom">Prénom</label>
                            <input id="fe-prenom" className={ui.input} value={client.prenom} onChange={setClientField('prenom')} />
                        </div>
                        <div className={ui.field}>
                            <label className={ui.label} htmlFor="fe-nom">Nom</label>
                            <input id="fe-nom" className={ui.input} value={client.nom} onChange={setClientField('nom')} />
                        </div>
                    </div>
                    <div className={ui.row}>
                        <div className={ui.field}>
                            <label className={ui.label} htmlFor="fe-email">Email</label>
                            <input id="fe-email" className={ui.input} type="email" value={client.email} onChange={setClientField('email')} />
                        </div>
                        <div className={ui.field}>
                            <label className={ui.label} htmlFor="fe-tel">Téléphone</label>
                            <input id="fe-tel" className={ui.input} type="tel" value={client.telephone} onChange={setClientField('telephone')} />
                        </div>
                    </div>
                    <div className={ui.field}>
                        <label className={ui.label} htmlFor="fe-adresse">Adresse</label>
                        <input id="fe-adresse" className={ui.input} value={client.adresse} onChange={setClientField('adresse')} />
                    </div>
                </fieldset>

                {/* Événement */}
                <fieldset className={styles.group}>
                    <legend className={styles.legend}><CalendarDays size={16} aria-hidden="true" /> Événement</legend>
                    <div className={ui.row}>
                        <div className={ui.field}>
                            <label className={ui.label} htmlFor="fe-date">Date</label>
                            <input id="fe-date" className={ui.input} type="date" value={eventDate || ''} onChange={e => setEventDate(e.target.value)} />
                        </div>
                        <div className={ui.field}>
                            <label className={ui.label} htmlFor="fe-prestation">Prestation</label>
                            <select id="fe-prestation" className={ui.select} value={deliveryType} onChange={e => setDeliveryType(e.target.value)}>
                                <option value="pickup">Retrait sur place</option>
                                <option value="delivery">Livraison simple</option>
                                <option value="setup">Livraison avec installation</option>
                            </select>
                        </div>
                    </div>
                </fieldset>

                {/* Lignes */}
                <fieldset className={styles.group}>
                    <legend className={styles.legend}><ListOrdered size={16} aria-hidden="true" /> Lignes <span className={ui.count}>{lignes.length}</span></legend>
                    <div className={styles.lines}>
                        <div className={styles.lineHead} aria-hidden="true">
                            <span>Désignation</span><span>Modèle / détail</span><span>Qté</span><span>Prix unit.</span><span />
                        </div>
                        {lignes.map((l, i) => (
                            <div key={i} className={styles.line}>
                                <input className={ui.input} value={l.nom} onChange={e => updateLine(i, 'nom', e.target.value)}
                                    placeholder="Désignation" aria-label={`Désignation ligne ${i + 1}`} />
                                <input className={ui.input} value={l.modele || ''} onChange={e => updateLine(i, 'modele', e.target.value)}
                                    placeholder="Modèle" aria-label={`Modèle ligne ${i + 1}`} />
                                <input className={ui.input} type="number" min={1} step={1} inputMode="numeric" value={l.quantite}
                                    onChange={e => updateLine(i, 'quantite', e.target.value)} aria-label={`Quantité ligne ${i + 1}`} />
                                <input className={ui.input} type="number" min={0} step={0.01} inputMode="decimal" value={l.prix}
                                    onChange={e => updateLine(i, 'prix', e.target.value)} aria-label={`Prix unitaire ligne ${i + 1}`} />
                                <button type="button" className={`${ui.iconBtn} ${ui.iconBtnDanger}`} onClick={() => removeLine(i)}
                                    aria-label={`Supprimer la ligne ${i + 1}`} title="Supprimer la ligne">
                                    <Trash2 size={16} />
                                </button>
                                {l.type === 'pack' && l.produits?.length > 0 && (
                                    <p className={styles.packNote}>Pack : {l.produits.map(sp => `${sp.nom} × ${sp.quantite}`).join(', ')}</p>
                                )}
                            </div>
                        ))}
                    </div>
                    <button type="button" className={`${ui.btn} ${ui.btnSecondary} ${ui.btnSmall} ${styles.addLine}`}
                        onClick={() => setLignes(list => [...list, emptyLine()])}>
                        <Plus size={15} aria-hidden="true" /> Ajouter une ligne
                    </button>
                </fieldset>

                {/* Frais */}
                <fieldset className={styles.group}>
                    <legend className={styles.legend}><Receipt size={16} aria-hidden="true" /> Frais</legend>
                    <div className={styles.fees}>
                        {[['montage', 'Montage / démontage (€)'], ['livraison', 'Livraison (€)'], ['caution', 'Caution (€)']].map(([key, label]) => (
                            <div key={key} className={ui.field}>
                                <label className={ui.label} htmlFor={`fe-${key}`}>{label}</label>
                                <input id={`fe-${key}`} className={ui.input} type="number" min={0} step={0.01} inputMode="decimal"
                                    value={frais[key]} onChange={setFraisField(key)} placeholder="0" />
                            </div>
                        ))}
                    </div>
                </fieldset>

                <div className={styles.summary}>
                    <span>Matériel : <strong>{formatPrice(totals.materiel)}</strong></span>
                    <span className={styles.total}>Nouveau total : <strong>{formatPrice(totals.total)}</strong></span>
                </div>

                <div className={ui.formActions}>
                    <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={onClose}>Annuler</button>
                    <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={preview} disabled={previewing}>
                        <Eye size={17} aria-hidden="true" /> {previewing ? 'Aperçu…' : 'Aperçu'}
                    </button>
                    <SubmitButton loading={saving} loadingLabel="Émission…" icon={FileCheck2}>Émettre la facture corrigée</SubmitButton>
                </div>
            </form>
        </Modal>
    );
}
