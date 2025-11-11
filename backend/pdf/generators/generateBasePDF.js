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
        showConditions = true, includeCaution = true, caution = 0, dateLabel = ''
    } = args;

    // Ajout entête
    addHeader(doc);
    doc.on('pageAdded', () => {
        addHeader(doc);
        doc.moveDown(5);
    });

    // Totaux produits et frais
    const totalProduits = formatTotal(produits);
    const totalFrais = toNumber(frais.montage) + toNumber(frais.livraison);
    const total = totalProduits + totalFrais;

    // Arrhes et solde
    const arrhes = Math.round(total * 0.3 * 100) / 100;
    const solde = Math.round(total * 0.7 * 100) / 100;

    // Colonnes tableau
    const colWidths = { produit: 170, modele: 200, qte: 40, unit: 70, total: 70 };
    const pad = 10;
    const fullWidth = colWidths.produit + colWidths.modele + colWidths.qte + colWidths.unit + colWidths.total + (4 * pad);
    const fullPageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const itemX = (doc.page.width - fullWidth) / 2;
    const modelX = itemX + colWidths.produit + pad;
    const qtyX = modelX + colWidths.modele + pad;
    const unitX = qtyX + colWidths.qte + pad;
    const totalX = unitX + colWidths.unit + pad;

    // Titre
    doc.moveDown(5);
    doc.fontSize(24).fillColor(couleurTitre)
        .text(titre, doc.page.margins.left, doc.y, { width: fullPageWidth, align: 'center', underline: true });

    if (dateLabel) {
        doc.fontSize(12).fillColor('black')
            .text(dateLabel, { align: 'center' })
            .moveDown();
    }

    // Client
    renderClientBox(doc, { nom, prenom, telephone, email, eventDate, adresse }, itemX, fullWidth);

    // Options
    const optionsText = deliveryType === "setup"
        ? "Livraison avec installation (montage/démontage demandés)"
        : deliveryType === "delivery"
            ? "Livraison simple (sans montage/démontage)"
            : "Retrait sur place (Erre, sur rendez-vous)";

    doc.font('Helvetica-Bold').fontSize(13).fillColor('#308546')
        .text("Options choisies :", { underline: true });
    doc.font('Helvetica').fontSize(12).fillColor('black')
        .text(`- ${optionsText}`).moveDown();

    // Tableau produits
    renderTable(doc, produits, itemX, modelX, qtyX, unitX, totalX, fullWidth);
    doc.moveDown(1);

    // Bloc montants (sous-total, frais, total, arrhes, solde, lien paiement)
    const montantLines = [
        { label: 'Sous-total produits (€)', value: totalProduits },
        { label: 'Frais montage/démontage (€)', value: toNumber(frais.montage) },
        { label: 'Tarif livraison (€)', value: toNumber(frais.livraison) },
        { label: 'Total (€)', value: total },
        { label: 'Montant des arrhes (30%)', value: arrhes },
        { label: 'Montant du solde restant ', value: solde }
    ];

    // Calcul hauteur du bloc
    let blocHeight = montantLines.length * 18 + 10;
    if (includeCaution && toNumber(caution) > 0) blocHeight += 40;

    // Nouvelle page si nécessaire
    if (doc.y + blocHeight > doc.page.height - doc.page.margins.bottom) doc.addPage();

    const blocY = doc.y;
    doc.save()
        .rect(itemX, blocY, fullWidth, blocHeight)
        .fillOpacity(0.05)
        .fill('#CCCCCC')
        .restore();

    // Affichage des montants
    let currentY = blocY + 5;
    doc.font('Helvetica-Bold').fontSize(12).fillColor('black');
    montantLines.forEach(line => {
        doc.text(line.label, itemX + 10, currentY);
        doc.text(`${line.value.toFixed(2)} €`, itemX + fullWidth - 110, currentY, { width: 100, align: 'right' });
        currentY += 18;
    });

    // Lien paiement sous les totaux
    if (args.lienPaiement) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#007ACC')
            .text(`Lien de paiement : ${args.lienPaiement}`, itemX + 10, currentY, { underline: true });
        currentY += 18;
    }

    // Caution juste en dessous si présente
    if (includeCaution && toNumber(caution) > 0) {
        const boxY = currentY + 5;
        doc.save().lineWidth(1).strokeColor('#ef4444')
            .rect(itemX, boxY, fullWidth, 30).stroke();
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#ef4444')
            .text(`Caution demandée : ${toNumber(caution).toFixed(2)} €`, itemX + 10, boxY + 8);
        doc.restore();
        doc.y = boxY + 40;
    } else {
        doc.y = currentY + 10;
    }

    // Page séparée pour détails / conditions
    if (showConditions) {
        doc.addPage();
        doc.moveDown(5);
        doc.font('Helvetica-Bold').fontSize(12).fillColor('black')
            .text("Détails - Retrait, Livraison et Montage/Démontage", { underline: true })
            .moveDown(0.5);
        doc.font('Helvetica').fontSize(11).fillColor('black');

        if (args.customConditionsText) {
            doc.text(args.customConditionsText);
        } else {
            doc.text(
                "- Le client est responsable du matériel pendant la période de location.\n" +
                "- Des Arrhes sont à verser pour confirmer la réservation, lesquelles sont non remboursables en cas d'annulation.\n" +
                "- En cas de dommage ou de perte, le client s'engage à rembourser la valeur totale de la caution.\n" +
                "- La caution est restituée sous 5 jours ouvrés après inspection."
            );
        }
    }

    return total;
}

module.exports = { generateBasePDF };
