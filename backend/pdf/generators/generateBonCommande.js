const PDFDocument = require('pdfkit');
const { generateBasePDF } = require('./generateBasePDF');

function toNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function generateBonCommandePDF(args) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Totaux produits et frais
        const totalProduits = args.produits?.reduce((sum, p) => sum + toNumber(p.prix) * toNumber(p.quantite), 0) || 0;
        const frais = {
            montage: toNumber(args.montage),
            livraison: toNumber(args.livraison),
            caution: toNumber(args.caution)
        };
        const totalTTC = totalProduits + frais.montage + frais.livraison;

        // Arrhes et solde
        const arrhes = Math.round(totalTTC * 0.3 * 100) / 100;
        const solde = Math.round(totalTTC * 0.7 * 100) / 100;

        // Bloc customTotals à passer à generateBasePDF
        const customTotals = [
            `Sous-total produits : ${totalProduits.toFixed(2)} €`,
            `Frais de montage/démontage : ${frais.montage.toFixed(2)} €`,
            `Frais de livraison : ${frais.livraison.toFixed(2)} €`,
            `Total : ${totalTTC.toFixed(2)} €`,
            `Montant des arrhes : ${arrhes.toFixed(2)} €`,
            `Montant du solde restant : ${solde.toFixed(2)} €`
        ];

        generateBasePDF(doc, {
            ...args,
            titre: `BON DE COMMANDE #${args.id || ''}`,
            couleurTitre: '#007ACC',
            couleurTotal: '#007ACC',
            showConditions: true,
            includeCaution: true,
            frais,
            customTotals,
            dateLabel: `Émis le ${new Date().toLocaleDateString('fr-FR')}`,
            lienPaiement: args.lienPaiement || '—',
            customConditionsText:
                `- Le client est responsable du matériel pendant la période de location.
- Des arrhes sont à verser pour confirmer la réservation, lesquelles sont non remboursables en cas d'annulation.
- En cas de dommage ou de perte, le client s'engage à rembourser la valeur totale de la caution.
- La caution est restituée sous 5 jours ouvrés après inspection.
- Modes de paiement acceptés : carte bancaire, virement, espèces, chèques.
- La réservation est confirmée uniquement après versement des arrhes.`

        });

        doc.end();
    });
}

module.exports = { generateBonCommandePDF };