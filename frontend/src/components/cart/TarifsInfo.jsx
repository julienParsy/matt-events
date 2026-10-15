// @feature panier — Grille des frais (installation, livraison, caution), dépliable
import React from 'react';
import PropTypes from 'prop-types';
import useTarifs from '../../hooks/useTarifs';
import styles from '../../styles/components/TarifsInfo.module.css';

export default function TarifsInfo({ defaultOpen = false }) {
    const tarifs = useTarifs();

    // Rien à afficher tant que la grille n'est pas chargée (ou si l'appel échoue)
    if (tarifs.length === 0) return null;

    return (
        <details className={styles.tarifs} open={defaultOpen}>
            <summary className={styles.summary}>
                Frais de livraison, d’installation et caution
            </summary>
            <p className={styles.intro}>
                Ces frais s’ajoutent au prix du matériel. Le montant exact vous est confirmé sur le devis.
            </p>
            <div className={styles.columns}>
                {tarifs.map((col) => (
                    <section key={col.title} className={styles.column}>
                        <h3 className={styles.title}>{col.title}</h3>
                        <ul className={styles.list}>
                            {col.items.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </details>
    );
}

TarifsInfo.propTypes = {
    defaultOpen: PropTypes.bool,
};
