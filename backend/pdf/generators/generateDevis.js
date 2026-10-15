// @feature demandes, pdf — Devis (valable jusqu'à quelques jours avant l'événement)
const { DEVIS_VALIDITY_DAYS_BEFORE_EVENT } = require('../pdfConstants');
const { formatShortDate, addDays } = require('../pdfHelpers');
const {
    createPdf, computeTotals, drawHeader, drawParties, drawItemsTable, drawTotalsAndPayment, drawSignature, drawConditions,
} = require('./generateBasePDF');

function generateDevisPDF(args) {
    const numero = args.devisNumero ? String(args.devisNumero) : '';
    const reference = numero ? `Devis n° ${numero}` : 'Devis';
    const totals = computeTotals(args.produits, args.frais);
    const today = new Date();

    // Pas de délai fixe : valable jusqu'à quelques jours avant l'événement (s'il est connu et assez loin)
    const limit = addDays(args.eventDate, -DEVIS_VALIDITY_DAYS_BEFORE_EVENT);
    const validUntil = limit && limit > today ? formatShortDate(limit) : null;

    return createPdf({ title: reference, reference }, (doc, layout) => {
        drawHeader(doc, layout, {
            label: 'DEVIS',
            numero,
            meta: [
                { label: 'Date', value: formatShortDate(today) },
                validUntil && { label: "Valable jusqu'au", value: validUntil },
            ],
        });
        drawParties(doc, layout, { client: args, eventDate: args.eventDate, deliveryType: args.deliveryType });
        drawItemsTable(doc, layout, args.produits);
        drawTotalsAndPayment(doc, layout, { totals, eventDate: args.eventDate, paymentTitle: 'Modalités de paiement' });
        drawSignature(doc, layout,
            (validUntil
                ? `Devis valable jusqu'au ${validUntil}, soit ${DEVIS_VALIDITY_DAYS_BEFORE_EVENT} jours avant l'événement. `
                : '') +
            "Le matériel n'est réservé qu'après réception du devis signé et du versement des arrhes, dans la limite des disponibilités.");
        drawConditions(doc, layout);
    });
}

module.exports = { generateDevisPDF };
