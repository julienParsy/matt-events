// pdfHelpers.js
const fs = require('fs');
const path = require('path');
const { COMPANY } = require('./pdfConstants');


function toNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}
function getQty(p) {
    return toNumber(p?.quantite ?? p?.quantity ?? 1) || 1;
}
function getUnitPrice(p) {
    return toNumber(p?.prix ?? p?.price ?? 0);
}

function formatTotal(produits) {
    if (!Array.isArray(produits)) {
        console.warn("[formatTotal] Appelé sans tableau produits :", produits);
        return 0;
    }
    return produits.reduce((sum, p) => {
        return sum + getUnitPrice(p) * getQty(p);
    }, 0);
}

function addHeader(doc) {
    const x = doc.page.margins.left;
    const y = 20;

    doc.save();
    try {
        if (fs.existsSync(COMPANY.logoPath)) {
            doc.image(COMPANY.logoPath, x, y, { width: 60, height: 60, fit: [60, 60] });
        }
    } catch (err) {
        console.warn("Erreur insertion logo:", err);
    }

    const textX = x + 80;
    doc.font('Helvetica-Bold').fontSize(15).fillColor('black').text(COMPANY.name, textX, y);
    doc.font('Helvetica').fontSize(10)
        .text(COMPANY.adresse, textX, y + 18)
        .text(`SIRET : ${COMPANY.siret}`, textX, y + 32)
        .text(COMPANY.email, textX, y + 46);
    doc.restore();
}

function renderClientBox(doc, { nom, prenom, telephone, email, eventDate }, x, width) {
    const padding = 10, lineHeight = 18, titleHeight = 20;
    const dateStr = eventDate ? new Date(eventDate).toLocaleDateString('fr-FR', { dateStyle: 'full' }) : '-';
    const lines = [
        `Nom : ${prenom} ${nom}`,
        `Téléphone : ${telephone}`,
        `Email : ${email}`,
        `Date de l’événement : ${dateStr}`
    ];
    const boxHeight = titleHeight + lines.length * lineHeight + padding * 2;
    const y = doc.y;
    doc.save().rect(x, y, width, boxHeight).fillOpacity(0.1).fill('#CCCCCC').restore();
    doc.strokeColor('#007ACC').lineWidth(1).rect(x, y, width, boxHeight).stroke();
    let currentY = y + padding;
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#007ACC')
        .text("Informations du client", x + padding, currentY);
    currentY += titleHeight;
    doc.font('Helvetica').fontSize(12).fillColor('black');
    lines.forEach(line => {
        doc.text(line, x + padding, currentY);
        currentY += lineHeight;
    });
    doc.moveDown(2);
}

function renderTable(doc, produits, itemX, modelX, qtyX, unitX, totalX, fullWidth) {
    const headerY = doc.y;
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#333');
    doc.text('Produit', itemX, headerY, { width: modelX - itemX - 10 });
    doc.text('Modèle', modelX, headerY, { width: qtyX - modelX - 10 });
    doc.text('Qté', qtyX, headerY, { width: unitX - qtyX - 10, align: 'right' });
    doc.text('PU (€)', unitX, headerY, { width: totalX - unitX - 10, align: 'right' });
    doc.text('Total (€)', totalX, headerY, { width: 70, align: 'right' });

    doc.moveTo(itemX, headerY + 18)
        .lineTo(itemX + fullWidth, headerY + 18)
        .strokeColor('#007ACC').stroke();

    let y = headerY + 25;
    doc.font('Helvetica').fontSize(12).fillColor('black');

    produits.forEach(p => {
        const productText = p.nom || '-';
        const modelText = p.modele || '-';
        const qty = getQty(p);
        const unit = getUnitPrice(p);
        const lineTotal = unit * qty;

        // Mesure pour éviter les dépassements
        const rowHeight = Math.max(
            doc.heightOfString(productText, { width: modelX - itemX - 10 }),
            doc.heightOfString(modelText, { width: qtyX - modelX - 10 }),
            doc.heightOfString(String(qty), { width: unitX - qtyX - 10 }),
            doc.heightOfString(unit.toFixed(2), { width: totalX - unitX - 10 }),
            doc.heightOfString(lineTotal.toFixed(2), { width: 70 })
        ) + 5;

        // Nouvelle page si nécessaire
        if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 30) {
            doc.addPage();

            const headerBottomY = doc.page.margins.top + 90;
            let ny = headerBottomY;

            doc.font('Helvetica-Bold').fontSize(14).fillColor('#333');
            doc.text('Produit', itemX, ny, { width: modelX - itemX - 10 });
            doc.text('Modèle', modelX, ny, { width: qtyX - modelX - 10 });
            doc.text('Qté', qtyX, ny, { width: unitX - qtyX - 10, align: 'right' });
            doc.text('PU (€)', unitX, ny, { width: totalX - unitX - 10, align: 'right' });
            doc.text('Total (€)', totalX, ny, { width: 70, align: 'right' });

            doc.moveTo(itemX, ny + 18)
                .lineTo(itemX + fullWidth, ny + 18)
                .strokeColor('#007ACC').stroke();

            y = ny + 25;
            doc.font('Helvetica').fontSize(12).fillColor('black');
        }

        // Ligne
        doc.text(productText, itemX, y, { width: modelX - itemX - 10 });
        doc.text(modelText, modelX, y, { width: qtyX - modelX - 10 });
        doc.text(String(qty), qtyX, y, { width: unitX - qtyX - 10, align: 'right' });
        doc.text(unit.toFixed(2), unitX, y, { width: totalX - unitX - 10, align: 'right' });
        doc.text(lineTotal.toFixed(2), totalX, y, { width: 70, align: 'right' });

        // Ligne séparatrice
        doc.moveTo(itemX, y + rowHeight - 5)
            .lineTo(itemX + fullWidth, y + rowHeight - 5)
            .strokeColor('#e0e0e0').stroke();
        y += rowHeight;

        // Détail des sous-produits d'un pack (facultatif, visuel)
        if (p.type === 'pack' && Array.isArray(p.produits)) {
            doc.font('Helvetica-Oblique').fontSize(11).fillColor('#444');
            p.produits.forEach(sp => {
                const line = `  - ${sp.nom || '-'} — ${sp.modele || '-'} × ${sp.quantite || 1}`;
                doc.text(line, itemX + 15, y, { width: fullWidth - 15 });
                y += doc.heightOfString(line, { width: fullWidth - 15 }) + 2;
            });
            doc.font('Helvetica').fontSize(12).fillColor('black');
        }
    });

    return y;
}


function drawSectionTitle(doc, title) {
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#007ACC')
        .text(title, { underline: true });
    doc.moveDown(0.5);
}

function drawBulletList(doc, items) {
    doc.font('Helvetica').fontSize(11).fillColor('black');
    items.forEach(item => {
        doc.text(`• ${item}`, { indent: 15 });
    });
    doc.moveDown(1);
}


module.exports = {
    formatTotal,
    addHeader,
    renderClientBox,
    renderTable,
    drawSectionTitle,
    drawBulletList
};