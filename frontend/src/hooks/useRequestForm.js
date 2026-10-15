// @feature panier — Formulaire de demande : validation, envoi et PDF
import { useRef, useState } from 'react';
import http from '../services/axiosInstance';
import { toLocalISODate, toPayloadItem } from '../utils/cart';

export const initialForm = {
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    eventDate: '',
    deliveryType: 'pickup',
    adresse: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9\s+().-]{8,}$/;

/** Avec responseType: 'blob', les erreurs serveur arrivent aussi en blob : on les relit. */
async function extractErrorMessage(err) {
    if (!err?.response) {
        return 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.';
    }
    const data = err.response.data;
    if (data instanceof Blob) {
        try {
            const json = JSON.parse(await data.text());
            if (json?.message || json?.error) return json.message || json.error;
        } catch {
            /* corps non JSON : message générique ci-dessous */
        }
    }
    return 'Votre demande n’a pas pu être envoyée. Réessayez dans quelques instants.';
}

function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

export default function useRequestForm({ cart, onSuccess }) {
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [captchaToken, setCaptchaToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [wantsDownload, setWantsDownload] = useState(false);
    const recaptchaRef = useRef(null);

    const needsAddress = form.deliveryType !== 'pickup';

    const resetCaptcha = () => {
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
    };

    const validate = () => {
        const errs = {};
        if (!form.nom.trim()) errs.nom = 'Le nom est requis.';
        if (!form.prenom.trim()) errs.prenom = 'Le prénom est requis.';
        if (!PHONE_RE.test(form.telephone.trim())) errs.telephone = 'Numéro de téléphone invalide.';
        if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Adresse e-mail invalide.';

        if (!form.eventDate) {
            errs.eventDate = 'La date de l’événement est requise.';
        } else if (form.eventDate < toLocalISODate()) {
            // Comparaison de chaînes YYYY-MM-DD : pas de piège de fuseau horaire.
            errs.eventDate = 'La date ne peut pas être antérieure à aujourd’hui.';
        }

        if (!form.deliveryType) errs.deliveryType = 'Choisissez un mode de retrait ou de livraison.';
        if (needsAddress && !form.adresse.trim()) errs.adresse = 'L’adresse est requise pour une livraison.';
        if (!captchaToken) errs.captcha = 'Veuillez valider le reCAPTCHA.';

        setErrors(errs);
        return errs;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Efface l'erreur du champ dès que l'utilisateur le corrige.
        setErrors((prev) => ({
            ...prev,
            [name]: '',
            ...(name === 'deliveryType' ? { adresse: '' } : {}),
        }));
    };

    const handleCaptchaChange = (token) => {
        setCaptchaToken(token);
        if (token) setErrors((prev) => ({ ...prev, captcha: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading || cart.length === 0) return;
        if (Object.keys(validate()).length > 0) return;

        setLoading(true);
        setSubmitError('');

        try {
            const client = Object.fromEntries(
                Object.entries(form).map(([key, value]) => [key, value.trim()])
            );
            if (!needsAddress) client.adresse = '';

            const { data: blob } = await http.post(
                '/demande',
                {
                    client,
                    produits: cart.map(toPayloadItem),
                    captchaToken,
                    download: wantsDownload,
                },
                {
                    responseType: 'blob',
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 20000,
                }
            );

            if (wantsDownload) downloadBlob(blob, 'demande.pdf');

            setForm(initialForm);
            setErrors({});
            setWantsDownload(false);
            setCaptchaToken(null);
            onSuccess();
        } catch (err) {
            console.error(err);
            setSubmitError(await extractErrorMessage(err));
            // Le token reCAPTCHA est à usage unique : il faut en redemander un.
            resetCaptcha();
        } finally {
            setLoading(false);
        }
    };

    return {
        form,
        errors,
        loading,
        submitError,
        needsAddress,
        wantsDownload,
        setWantsDownload,
        recaptchaRef,
        handleChange,
        handleCaptchaChange,
        handleSubmit,
        handleCaptchaExpired: () => setCaptchaToken(null),
    };
}