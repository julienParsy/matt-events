const PDFDocument = require('pdfkit');
const { formatTotal, addHeader, renderClientBox, renderTable } = require('../pdfHelpers');
const { COMPANY } = require('../pdfConstants');

function toNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function generateBasePDF(doc, args) {
    const {
        produits, email, nom, prenom, telephone, eventDate, adresse, deliveryType, frais = {},
        titre = '', couleurTitre = '#000', couleurTotal = '#000',
        showConditions = true, includeCaution = true, caution = 0, dateLabel = '',
        lienPaiement = '', customConditionsText = ''
    } = args;

    // En-tête (logo + coordonnées)
    addHeader(doc);
    doc.on('pageAdded', () => {
        addHeader(doc);
        doc.moveDown(4);
    });

    const totalProduits = formatTotal(produits);
    const totalFrais = toNumber(frais.montage) + toNumber(frais.livraison);
    const total = totalProduits + totalFrais;

    const arrhes = Math.round(total * 0.3 * 100) / 100;
    const solde = Math.round(total * 0.7 * 100) / 100;

    // Largeurs de colonnes
    const colWidths = { produit: 170, modele: 200, qte: 40, unit: 70, total: 70 };
    const pad = 10;
    const fullWidth = colWidths.produit + colWidths.modele + colWidths.qte + colWidths.unit + colWidths.total + (4 * pad);
    const fullPageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const itemX = (doc.page.width - fullWidth) / 2;
    const modelX = itemX + colWidths.produit + pad;
    const qtyX = modelX + colWidths.modele + pad;
    const unitX = qtyX + colWidths.qte + pad;
    const totalX = unitX + colWidths.unit + pad;

    // Titre principal
    doc.moveDown(4);
    doc.fontSize(24).fillColor(couleurTitre)
        .text(titre, { align: 'center', underline: true });

    // Date
    if (dateLabel) {
        doc.fontSize(12).fillColor('gray')
            .text(dateLabel, { align: 'center' })
            .moveDown(1);
    }

    // Infos client
    renderClientBox(doc, { nom, prenom, telephone, email, eventDate, adresse }, itemX, fullWidth);
    doc.moveDown(1);

    // Type de prestation
    const optionsText = deliveryType === "setup"
        ? "Livraison avec installation (montage/démontage demandés)"
        : deliveryType === "delivery"
            ? "Livraison simple (sans montage/démontage)"
            : "Retrait sur place (Erre, sur rendez-vous)";

    doc.font('Helvetica-Bold').fontSize(13).fillColor('#308546')
        .text("Options choisies :", { underline: true });
    doc.font('Helvetica').fontSize(12).fillColor('black')
        .text(`- ${optionsText}`)
        .moveDown(1);

    // Tableau des produits
    renderTable(doc, produits, itemX, modelX, qtyX, unitX, totalX, fullWidth);
    doc.moveDown(1.5);

    // Bloc totaux
    const montantLines = [
        { label: 'Sous-total produits (€)', value: totalProduits },
        { label: 'Frais de montage/démontage (€)', value: toNumber(frais.montage) },
        { label: 'Frais de livraison (€)', value: toNumber(frais.livraison) },
        { label: 'Total TTC (€)', value: total },
        { label: 'Montant des arrhes (30%)', value: arrhes },
        { label: 'Solde restant dû (70%)', value: solde }
    ];

    let blocHeight = montantLines.length * 18 + 20;
    if (includeCaution && toNumber(caution) > 0) blocHeight += 35;

    // Nouvelle page si bloc trop grand
    if (doc.y + blocHeight > doc.page.height - doc.page.margins.bottom) doc.addPage();

    const blocY = doc.y;
    doc.save()
        .rect(itemX, blocY, fullWidth, blocHeight)
        .fillOpacity(0.05)
        .fill('#CCCCCC')
        .restore();

    let currentY = blocY + 8;
    doc.font('Helvetica-Bold').fontSize(12).fillColor('black');
    montantLines.forEach(line => {
        doc.text(line.label, itemX + 10, currentY);
        doc.text(`${line.value.toFixed(2)} €`, itemX + fullWidth - 110, currentY, { width: 100, align: 'right' });
        currentY += 18;
    });

    // Lien de paiement (même ligne)
    if (lienPaiement) {
        doc.moveDown(1);
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#007ACC')
            .text(`Lien de paiement : `, itemX + 10, currentY)
            .fillColor('blue')
            .text(lienPaiement, { link: lienPaiement, underline: true });
        currentY += 20;
    }

    // Caution
    if (includeCaution && toNumber(caution) > 0) {
        const boxY = currentY + 8;
        doc.save().lineWidth(1).strokeColor('#ef4444')
            .rect(itemX, boxY, fullWidth, 30).stroke();
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#ef4444')
            .text(`Caution demandée : ${toNumber(caution).toFixed(2)} €`, itemX + 10, boxY + 8);
        doc.restore();
        doc.y = boxY + 40;
    } else {
        doc.y = currentY + 10;
    }

    // Page suivante : détails et conditions
    if (showConditions) {
        doc.addPage();
        doc.moveDown(4);
        doc.font('Helvetica-Bold').fontSize(13).fillColor('black')
            .text("Détails - Retrait, Livraison et Montage/Démontage", { underline: true })
            .moveDown(0.5);

        doc.font('Helvetica').fontSize(11).fillColor('black');
        doc.text(customConditionsText ||
            `- Le client est responsable du matériel pendant la période de location.
- Des arrhes sont à verser pour confirmer la réservation, lesquelles sont non remboursables en cas d'annulation.
- En cas de dommage ou de perte, le client s'engage à rembourser la valeur totale de la caution.
- La caution est restituée sous 5 jours ouvrés après inspection.
- Modes de paiement acceptés : carte bancaire, virement, espèces, chèques.
- La réservation est confirmée uniquement après versement des arrhes.`
        );
    }

    return total;
}

module.exports = { generateBasePDF };
