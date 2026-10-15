// @feature factures, pdf
// Avoir : annule intégralement une facture (série AV-AAAA-NNNN).
const { COLORS } = require('../pdfConstants');
const { formatShortDate, toDate } = require('../pdfHelpers');
const {
    createPdf, computeTotals, drawHeader, drawParties, drawItemsTable, drawTotalsAndPayment,
} = require('./generateBasePDF');

/**
 * args.avoirNumero   : numéro de l'avoir (ex. AV-2026-0001)
 * args.dateAvoir     : date d'émission de l'avoir
 * args.factureNumero : facture annulée
 * args.dateFacture   : date de la facture annulée
 * + contenu de la facture annulée (client, produits, frais…)
 */
function generateAvoirPDF(args) {
    const numero = args.avoirNumero ? String(args.avoirNumero) : '';
    const reference = numero ? `Avoir n° ${numero}` : 'Avoir';
    const totals = computeTotals(args.produits, args.frais);
    const dateFacture = formatShortDate(args.dateFacture);

    return createPdf({ title: reference, reference }, (doc, layout) => {
        drawHeader(doc, layout, {
            label: 'AVOIR',
            numero,
            accent: COLORS.danger,
            meta: [
                { label: "Date d'émission", value: formatShortDate(toDate(args.dateAvoir) || new Date()) },
                { label: 'Annule la facture', value: args.factureNumero },
                args.demandeNumero && { label: 'Demande', value: `n° ${args.demandeNumero}` },
            ],
        });
        drawParties(doc, layout, { client: args, eventDate: args.eventDate, deliveryType: args.deliveryType });
        drawItemsTable(doc, layout, args.produits);
        drawTotalsAndPayment(doc, layout, {
            totals,
            sign: -1,
            totalLabel: 'TOTAL AVOIR',
            showSchedule: false,
            paymentTitle: 'Annulation',
            paymentNote: `Cet avoir annule intégralement la facture ${args.factureNumero}${dateFacture ? ` du ${dateFacture}` : ''}. ` +
                'Les sommes déjà versées au titre de cette facture sont remboursées ou reportées sur la facture qui la remplace.',
        });
    });
}

module.exports = { generateAvoirPDF };
