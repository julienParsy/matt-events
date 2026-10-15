// @feature demandes, pdf — Bon de commande (avec lien de paiement des arrhes)
const { formatShortDate, toNumber } = require('../pdfHelpers');
const {
    createPdf, computeTotals, drawHeader, drawParties, drawItemsTable, drawTotalsAndPayment, drawPaymentLink, drawConditions,
} = require('./generateBasePDF');

/**
 * args.id           : numéro de la demande
 * args.eventDate    : date de l'événement (Date ou "AAAA-MM-JJ", pas une date déjà écrite en toutes lettres)
 * args.lienPaiement : lien de paiement en ligne des arrhes
 * args.montage, args.livraison, args.caution : frais saisis dans l'admin
 */
function generateBonCommandePDF(args) {
    const numero = args.id ? String(args.id) : '';
    const reference = numero ? `Bon de commande n° ${numero}` : 'Bon de commande';
    const totals = computeTotals(args.produits, {
        montage: toNumber(args.montage),
        livraison: toNumber(args.livraison),
        caution: toNumber(args.caution),
    });

    return createPdf({ title: reference, reference }, (doc, layout) => {
        drawHeader(doc, layout, {
            label: 'BON DE COMMANDE',
            numero,
            meta: [{ label: 'Date', value: formatShortDate(new Date()) }],
        });
        drawParties(doc, layout, { client: args, eventDate: args.eventDate, deliveryType: args.deliveryType });
        drawItemsTable(doc, layout, args.produits);
        drawTotalsAndPayment(doc, layout, { totals, eventDate: args.eventDate, paymentTitle: 'Modalités de paiement' });
        drawPaymentLink(doc, layout, args.lienPaiement);
        drawConditions(doc, layout);
    });
}

module.exports = { generateBonCommandePDF };
