const PDFDocument = require('pdfkit');
const { generateBasePDF } = require('./generateBasePDF');

function generateDevisPDF(args) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        generateBasePDF(doc, {
            ...args,
            titre: `DEVIS #${args.devisNumero || ''}`,
            couleurTitre: '#00A0E3',
            couleurTotal: '#00A0E3',
            showConditions: true,
            includeCaution: true,
            caution: args.frais?.caution || 0,
            dateLabel: `Émis le ${new Date().toLocaleDateString('fr-FR')}`
        });

        doc.end();
    });
}

module.exports = { generateDevisPDF };