import React, { useEffect, useState } from 'react';
import axiosInstance from '../../services/axiosInstance';
import btnStyles from '../../styles/components/Button.module.css';
import modalStyles from '../../styles/components/Modal.module.css';
import stylesBack from '../../styles/components/BackButton.module.css';

export default function AdminDocumentModal({ id, closeModal }) {
    const [demande, setDemande] = useState(null);
    const [loading, setLoading] = useState(true);
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
                console.error("Erreur récupération de la demande :", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDemande();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const endpoint = `/demande/${id}/${typeDoc}`;
            const body = {
                adresse,
                montage: parseFloat(montage),
                livraison: parseFloat(livraison),
                caution: parseFloat(caution),
                eventDate: demande.event_date || demande.eventDate || null, 
            };
            if (typeDoc === 'bonCommande') body.paymentLink = paymentLink;

            const res = await axiosInstance.post(endpoint, body, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${typeDoc}_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            closeModal();
        } catch (err) {
            console.error("Erreur génération PDF :", err);
            alert(`Erreur lors de la génération du ${typeDoc}.`);
        }
    };


    if (loading) return <p>Chargement...</p>;
    if (!demande) return <p>Demande introuvable.</p>;

    return (
        <div className={modalStyles.modalCenter}>
            <form onSubmit={handleSubmit} className={modalStyles.modalContent}>
                <nav className={stylesBack.breadcrumb}>
                    <span className={stylesBack.breadcrumbItem} onClick={closeModal}>
                        Demandes n°{id}
                    </span>
                    <span className={stylesBack.breadcrumbSep}>/</span>
                    <span className={stylesBack.breadcrumbItemActive}>
                        Générer {typeDoc}
                    </span>
                </nav>

                <div className={modalStyles.formGroup}>
                    <label className={modalStyles.modalLabel} htmlFor="adresse">Adresse du client</label>
                    <input
                        type="text"
                        id="adresse"
                        value={adresse}
                        onChange={(e) => setAdresse(e.target.value)}
                        className={modalStyles.modalInput}
                        required
                    />
                </div>

                <div className={modalStyles.formGroup}>
                    <label className={modalStyles.modalLabel} htmlFor="montage">Frais montage/démontage (€)</label>
                    <input
                        type="number"
                        id="montage"
                        value={montage}
                        onChange={(e) => setMontage(e.target.value)}
                        className={modalStyles.modalInput}
                    />
                </div>

                <div className={modalStyles.formGroup}>
                    <label className={modalStyles.modalLabel} htmlFor="livraison">Tarif livraison (€)</label>
                    <input
                        type="number"
                        id="livraison"
                        value={livraison}
                        onChange={(e) => setLivraison(e.target.value)}
                        className={modalStyles.modalInput}
                    />
                </div>

                <div className={modalStyles.formGroup}>
                    <label className={modalStyles.modalLabel} htmlFor="caution">Montant caution (€)</label>
                    <input
                        type="number"
                        id="caution"
                        value={caution}
                        onChange={(e) => setCaution(e.target.value)}
                        className={modalStyles.modalInput}
                    />
                </div>

                {typeDoc === 'bonCommande' && (
                    <div className={modalStyles.formGroup}>
                        <label className={modalStyles.modalLabel} htmlFor="paymentLink">Lien de paiement</label>
                        <input
                            type="text"
                            id="paymentLink"
                            value={paymentLink}
                            onChange={(e) => setPaymentLink(e.target.value)}
                            className={modalStyles.modalInput}
                            placeholder="Ex: https://paiement.com/..."
                            required
                        />
                    </div>
                )}

                <div className={modalStyles.formGroup}>
                    <label className={modalStyles.modalLabel} htmlFor="typeDoc">Type de document</label>
                    <select
                        id="typeDoc"
                        value={typeDoc}
                        onChange={(e) => setTypeDoc(e.target.value)}
                        className={modalStyles.modalSelect}
                    >
                        <option value="devis">Devis</option>
                        <option value="facture">Facture</option>
                        <option value="bonCommande">Bon de commande</option>
                    </select>
                </div>

                <button type="submit" className={`${btnStyles.button} ${btnStyles.btnConnexion}`}>
                    Générer le {typeDoc}
                </button>
            </form>
        </div>
    );
}
