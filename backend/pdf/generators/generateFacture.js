const PDFDocument = require('pdfkit');
const { generateBasePDF } = require('./generateBasePDF');
const { TVA_MENTION } = require('../pdfConstants');

function generateFacturePDF(args) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        generateBasePDF(doc, {
            ...args,
            titre: `FACTURE ${args.factureNumero || ''}`,
            couleurTitre: '#198754',
            couleurTotal: '#198754',
            showConditions: true,
            includeCaution: true,
            caution: args.frais?.caution || 0,
            dateLabel: `Émise le ${args.dateFacture || new Date().toLocaleDateString('fr-FR')}`
        });

        doc.moveDown(2);
        doc.font('Helvetica').fontSize(10).fillColor('black').text(TVA_MENTION, { align: 'left' });

        doc.end();
    });
}

module.exports = { generateFacturePDF };