import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
import NavAdmin from './NavAdmin';
import btnStyles from '../../styles/components/Button.module.css';
import modalStyles from '../../styles/components/Modal.module.css';
import styles from '../../styles/pages/AdminDevisFacture.module.css'; // crée un fichier CSS si besoin
import stylesBack from '../../styles/components/BackButton.module.css';

export default function AdminDevisFacture() {
    const { id } = useParams();
    const [demande, setDemande] = useState(null);
    const [loading, setLoading] = useState(true);
    const [adresse, setAdresse] = useState('');
    const [montage, setMontage] = useState(0);
    const [livraison, setLivraison] = useState(0);
    const [caution, setCaution] = useState(0);
    const [typeDoc, setTypeDoc] = useState('devis'); // 'devis' ou 'facture'

    useEffect(() => {
        const fetchDemande = async () => {
            try {
                const res = await axiosInstance.get(`/demande/${id}`);
                setDemande(res.data);
                setAdresse(res.data.adresse || ''); // <- pré-remplissage
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
            const res = await axiosInstance.post(`/demande/${id}/${typeDoc}`, {
                adresse,
                montage: parseFloat(montage),
                livraison: parseFloat(livraison),
                caution: parseFloat(caution)
            }, {
                responseType: 'blob' // pour recevoir un PDF
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${typeDoc}_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Erreur génération PDF :", err);
            alert("Erreur lors de la génération du document.");
        }
    };

    if (loading) return <p>Chargement...</p>;
    if (!demande) return <p>Demande introuvable.</p>;

    return (
        <div>
            <div className='banner'>
            <h1 >Générer {typeDoc === 'devis' ? 'un devis' : 'une facture'} pour {demande.prenom} {demande.nom}</h1>
            <NavAdmin />
            </div>
                <div className={modalStyles.modalCenter}>

                <form onSubmit={handleSubmit} className={modalStyles.modalContent}> 
                    <nav className={stylesBack.breadcrumb}>
                        <span className={stylesBack.breadcrumbItem} onClick={() => window.location.href = '/admin/demandes'}>Demandes n°{id}</span>
                        <span className={stylesBack.breadcrumbSep}>/</span>
                        <span className={stylesBack.breadcrumbItemActive}>Générer {typeDoc === 'devis' ? 'un devis' : 'une facture'}  </span>
                    </nav>
                    <div className={styles.formGroup}>
                        <label className={modalStyles.modalLabel} htmlFor="adresse">Adresse du client</label>
                        <input
                            type="text"
                            id="adresse"
                            value={adresse}
                            onChange={(e) => setAdresse(e.target.value)}
                            className={modalStyles.modalInput}
                            placeholder="Ex : 12 rue de la Paix, Lille"
                            required
                        />
                    </div>

                <div className={styles.formGroup}>
                    <label className={modalStyles.modalLabel} htmlFor="montage">Frais de montage / démontage (€)</label>
                    <input
                        type="number"
                        id="montage"
                        value={montage}
                        onChange={(e) => setMontage(e.target.value)}
                        className={modalStyles.modalInput}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={modalStyles.modalLabel} htmlFor="livraison">Tarif de livraison (€)</label>
                    <input
                        type="number"
                        id="livraison"
                        value={livraison}
                        onChange={(e) => setLivraison(e.target.value)}
                        className={modalStyles.modalInput}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={modalStyles.modalLabel} htmlFor="caution">Montant de la caution (€)</label>
                    <input
                        type="number"
                        id="caution"
                        value={caution}
                        onChange={(e) => setCaution(e.target.value)}
                        className={modalStyles.modalInput}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={modalStyles.modalLabel} htmlFor="typeDoc">Type de document</label>
                    <select
                        id="typeDoc"
                        value={typeDoc}
                        onChange={(e) => setTypeDoc(e.target.value)}
                        className={modalStyles.modalSelect}
                    >
                        <option value="devis">Devis</option>
                        <option value="facture">Facture</option>
                    </select>
                </div>

                <button type="submit" className={`${btnStyles.button} ${btnStyles.btnConnexion}`}>
                    Générer le {typeDoc}
                </button>
            </form>
        </div>
        </div>
    );
}
