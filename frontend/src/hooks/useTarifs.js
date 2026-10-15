// @feature panier
// Grille des frais (installation, livraison, caution) servie par /api/tarifs,
// la même que sur le PDF de la demande. Liste vide tant qu'elle n'est pas chargée ou si l'appel échoue.
import { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';

export default function useTarifs() {
    const [tarifs, setTarifs] = useState([]);

    useEffect(() => {
        axiosInstance
            .get('/tarifs')
            .then((res) => setTarifs(res.data))
            .catch((err) => console.error('Erreur chargement tarifs', err));
    }, []);

    return tarifs;
}
