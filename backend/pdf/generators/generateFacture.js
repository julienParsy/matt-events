// backend/pdf/generators/generateFacture.js
const { COLORS, PENALITES_MENTION } = require('../pdfConstants');
const { formatShortDate, toDate } = require('../pdfHelpers');
const {
    createPdf, computeTotals, drawHeader, drawParties, drawItemsTable, drawTotalsAndPayment, drawConditions, drawSmallPrint,
} = require('./generateBasePDF');

/**
 * args.factureNumero  : numéro de facture (série continue, ex. F-2026-0001)
 * args.dateFacture    : date d'émission (conservée si la facture est retéléchargée)
 * args.demandeNumero  : numéro de la demande d'origine (rappelé sur la facture)
 * args.remplaceNumero : facture annulée et remplacée par celle-ci (après correction)
 * args.apercu         : true = aperçu sans numéro, avec filigrane « APERÇU »
 */
function generateFacturePDF(args) {
    const numero = args.apercu ? '' : (args.factureNumero ? String(args.factureNumero) : '');
    const reference = args.apercu ? 'Aperçu de facture' : (numero ? `Facture n° ${numero}` : 'Facture');
    const totals = computeTotals(args.produits, args.frais);
    const dateFacture = toDate(args.dateFacture) || new Date();

    // Échéance : le solde est dû au plus tard le jour de l'événement ; sinon (date passée ou inconnue) à réception
    const event = toDate(args.eventDate);
    const echeance = event && event >= new Date(dateFacture.toDateString()) ? formatShortDate(event) : 'à réception';

    return createPdf({ title: reference, reference, watermark: args.apercu ? 'APERÇU' : null }, (doc, layout) => {
        drawHeader(doc, layout, {
            label: 'FACTURE',
            numero,
            accent: COLORS.green,
            meta: [
                args.apercu && { label: 'Document', value: 'aperçu non émis' },
                { label: "Date d'émission", value: formatShortDate(dateFacture) },
                { label: 'Échéance', value: echeance },
                args.demandeNumero && { label: 'Demande', value: `n° ${args.demandeNumero}` },
                args.remplaceNumero && { label: 'Remplace la facture', value: args.remplaceNumero },
            ],
        });
        drawParties(doc, layout, { client: args, eventDate: args.eventDate, deliveryType: args.deliveryType });
        drawItemsTable(doc, layout, args.produits);
        drawTotalsAndPayment(doc, layout, { totals, eventDate: event, paymentTitle: 'Règlement' });
        drawConditions(doc, layout);
        drawSmallPrint(doc, layout, PENALITES_MENTION);
    });
}

module.exports = { generateFacturePDF };
