// backend/pdf/generators/generateDemande.js
// Demande de location : envoyée à Matt'events (et téléchargée par le client) depuis le panier.
const { TARIFS } = require('../pdfConstants');
const { formatShortDate } = require('../pdfHelpers');
const {
    createPdf, computeTotals, drawHeader, drawParties, drawItemsTable, drawTotalsAndPayment,
    drawSectionTitle, drawInfoColumns, drawConditions,
} = require('./generateBasePDF');

function generateDemandePDF(args) {
    const numero = args.demandeNumero ? String(args.demandeNumero) : '';
    const reference = numero ? `Demande de location n° ${numero}` : 'Demande de location';
    const totals = computeTotals(args.produits, args.frais);

    return createPdf({ title: reference, reference }, (doc, layout) => {
        drawHeader(doc, layout, {
            label: 'DEMANDE',
            numero,
            meta: [{ label: 'Reçue le', value: formatShortDate(args.dateDemande || new Date()) }],
        });
        drawParties(doc, layout, { client: args, eventDate: args.eventDate, deliveryType: args.deliveryType });
        drawItemsTable(doc, layout, args.produits);
        drawTotalsAndPayment(doc, layout, {
            totals,
            eventDate: args.eventDate,
            paymentTitle: 'Estimation',
            paymentNote: "Montant indicatif. Les frais de livraison, d'installation et la caution seront précisés sur le devis.",
        });
        drawSectionTitle(doc, layout, 'Informations tarifaires');
        drawInfoColumns(doc, layout, TARIFS);
        drawConditions(doc, layout);
    });
}

module.exports = { generateDemandePDF };
