// generateBasePDF.js
const PDFDocument = require('pdfkit');
const { formatTotal, addHeader, renderClientBox, renderTable } = require('../pdfHelpers');

function toNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function generateBasePDF(doc, args) {
    const {
        produits, email, nom, prenom, telephone, eventDate, adresse, deliveryType, frais = {},
        titre = '', couleurTitre = '#000', couleurTotal = '#000',
        showConditions = true, includeCaution = true, caution = 0, dateLabel = ''
    } = args;

    addHeader(doc);
    doc.on('pageAdded', () => addHeader(doc));

    // ✅ Total produits basé sur quantités
    const totalProduits = formatTotal(produits);
    const totalFrais = toNumber(frais.montage) + toNumber(frais.livraison);
    const total = totalProduits + totalFrais;

    // ✅ Nouvelles largeurs de colonnes
    const colWidths = { produit: 170, modele: 200, qte: 40, unit: 70, total: 70 };
    const pad = 10;
    const fullWidth = colWidths.produit + colWidths.modele + colWidths.qte + colWidths.unit + colWidths.total + (4 * pad);
    const fullPageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Positions X
    const itemX = (doc.page.width - fullWidth) / 2;
    const modelX = itemX + colWidths.produit + pad;
    const qtyX = modelX + colWidths.modele + pad;
    const unitX = qtyX + colWidths.qte + pad;
    const totalX = unitX + colWidths.unit + pad;

    doc.moveDown(5);
    doc.fontSize(24)
        .fillColor(couleurTitre)
        .text(titre, doc.page.margins.left, doc.y, {
            width: fullPageWidth,
            align: 'center',
            underline: true
        });

    if (dateLabel) {
        doc.fontSize(12).fillColor('black')
            .text(dateLabel, { align: 'center' })
            .moveDown();
    }

    renderClientBox(doc, { nom, prenom, telephone, email, eventDate, adresse }, itemX, fullWidth);

    const optionsText = deliveryType === "setup"
        ? "Livraison avec installation (montage/démontage demandés)"
        : deliveryType === "delivery"
            ? "Livraison simple (sans montage/démontage)"
            : "Retrait sur place (Erre, sur rendez-vous)";

    doc.font('Helvetica-Bold').fontSize(13).fillColor('#308546')
        .text("Options choisies :", { underline: true });
    doc.font('Helvetica').fontSize(12).fillColor('black')
        .text(`- ${optionsText}`).moveDown();

    // ✅ Appel avec les nouvelles colonnes
    renderTable(doc, produits, itemX, modelX, qtyX, unitX, totalX, fullWidth);

    doc.moveDown(1);
    const rightX = itemX + fullWidth - 130;

    // Affichage des frais + Total
    const fraisLines = [];
    if (toNumber(frais.montage) > 0) fraisLines.push(`Frais de montage/démontage : ${toNumber(frais.montage).toFixed(2)} €`);
    if (toNumber(frais.livraison) > 0) fraisLines.push(`Frais de livraison : ${toNumber(frais.livraison).toFixed(2)} €`);

    if (fraisLines.length > 0) {
        // Afficher sous-total produits
        doc.fillColor('black').font('Helvetica-Bold').fontSize(12)
            .text(`Sous-total produits : ${totalProduits.toFixed(2)} €`, itemX, doc.y);
        // Afficher les lignes de frais
        doc.font('Helvetica').fontSize(12);
        fraisLines.forEach(line => {
            doc.text(line, itemX, doc.y + 2);
        });
    }

    // ✅ Total final (produits × qté + frais)
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(couleurTotal)
        .text(`Total : ${total.toFixed(2)} €`, rightX, doc.y, {
            align: 'right',
            width: 130,
            underline: true
        });

    // Caution
    if (includeCaution && toNumber(caution) > 0) {
        if (doc.y + 40 > doc.page.height - doc.page.margins.bottom) doc.addPage();
        const boxY = doc.y;
        doc.save().lineWidth(1).strokeColor('#ef4444')
            .rect(itemX, boxY, fullWidth, 30).stroke();
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#ef4444')
            .text(`Caution demandée : ${toNumber(caution).toFixed(2)} €`, itemX + 10, boxY + 8);
        doc.restore();
        doc.y = boxY + 40;
    }

    // Remise du curseur à gauche
    doc.x = doc.page.margins.left;
    doc.moveDown(1);

    if (showConditions) {
        doc.moveDown(3);
        if (args.customConditionsText) {
            doc.font('Helvetica-Bold').fontSize(12).fillColor('black')
                .text("Détails - Retrait, Livraison et Montage/Démontage", { underline: true });
            doc.font('Helvetica').fontSize(11).fillColor('black')
                .text(args.customConditionsText);
        } else {
            doc.font('Helvetica-Bold').fontSize(12).fillColor('black')
                .text("Conditions particulières :", { underline: true });
            doc.font('Helvetica').fontSize(11).fillColor('black')
                .text("- Le client est responsable du matériel pendant la période de location.\n"
                    + "- Toute annulation dans les 72h précédant l’événement entraîne des frais de 30%.\n"
                    + "- La caution est restituée sous 5 jours ouvrés après inspection.");
        }
    }

    return total;
}

module.exports = { generateBasePDF };
