// backend/pdf/pdfConstants.js
const path = require('path');

const COMPANY = {
    name: "MATT'EVENTS",
    adresse: "57 rue Hubert Parent prolongée, 59171 Erre",
    siret: "989 427 158 00013",
    email: "contact@mattevents.fr",
    site: "mattevents.fr",
    // Version légère du logo (240 px) : garde les PDF autour de 100 Ko au lieu de 1,5 Mo
    logoPath: path.join(__dirname, '..', 'assets', 'logo-pdf.png'),
    logoFallbackPath: path.join(__dirname, '..', 'assets', 'logo.png'),
};

const TVA_MENTION = "TVA non applicable, art. 293 B du CGI";

// Arrhes demandées à la réservation (part du total)
const ARRHES_RATE = 0.3;

// Devis : valable jusqu'à N jours avant l'événement (pas de délai fixe, les événements peuvent être lointains)
const DEVIS_VALIDITY_DAYS_BEFORE_EVENT = 7;

// Charte graphique des documents
const COLORS = {
    text: '#1f2330',
    muted: '#6b7280',
    border: '#e2e4ec',
    light: '#f4f5fa',
    zebra: '#fafbfe',
    accent: '#4f56e8',
    accentLight: '#eef0fd',
    green: '#308546',
    greenLight: '#e8f3eb',
    danger: '#c2410c',
};

// Conditions communes à tous les documents
const CONDITIONS = [
    "La réservation est confirmée après versement des arrhes (30 % du total). Les arrhes ne sont pas remboursables en cas d'annulation.",
    "Le solde est à régler au plus tard le jour de l'événement.",
    "Le client est responsable du matériel pendant toute la durée de la location.",
    "La caution est restituée sous 5 jours ouvrés après vérification du matériel ; elle peut être retenue en cas de dommage ou de perte.",
    "Moyens de paiement acceptés : carte bancaire, virement, espèces, chèque.",
];

// Mention obligatoire sur les factures (s'applique aux clients professionnels)
const PENALITES_MENTION =
    "Clients professionnels : en cas de retard de paiement, pénalités au taux de 3 fois le taux d'intérêt légal " +
    "et indemnité forfaitaire de 40 € pour frais de recouvrement (art. L441-10 du Code de commerce). Pas d'escompte pour paiement anticipé.";

// Grille tarifaire jointe aux demandes de location
const TARIFS = [
    {
        title: "Installation sono & lumière",
        items: [
            "Petite installation (2 enceintes + jeux de lumière simples) : 30 €",
            "Installation moyenne (sonorisation + lumières + structure légère) : 50 à 90 €",
            "Grosse installation (pack complet : pont, plusieurs effets…) : 100 à 200 €",
            "Le tarif exact dépend du lieu et du matériel utilisé.",
        ],
    },
    {
        title: "Livraison (aller-retour)",
        items: ["Jusqu'à 15 km : 5 €", "De 15 à 30 km : 20 €", "De 30 à 50 km : 35 €", "De 50 à 80 km : 50 €", "Au-delà : 0,80 €/km"],
    },
    {
        title: "Retrait & caution",
        items: [
            "Retrait sur place, sur rendez-vous, à Erre (59171).",
            "Caution selon le matériel loué : de 30 € à 800 €, rendue au retour du matériel en bon état.",
        ],
    },
];

module.exports = {
    COMPANY,
    TVA_MENTION,
    ARRHES_RATE,
    DEVIS_VALIDITY_DAYS_BEFORE_EVENT,
    COLORS,
    CONDITIONS,
    PENALITES_MENTION,
    TARIFS,
};
