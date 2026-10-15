// @feature pdf
// Mise en page commune aux 4 documents (demande, devis, facture, bon de commande).
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { COMPANY, COLORS, CONDITIONS, TVA_MENTION, ARRHES_RATE } = require('../pdfConstants');
const {
    getQty, getUnitPrice, formatMoney, formatLongDate, formatShortDate, computeTotals, deliveryLabel,
} = require('../pdfHelpers');

// A4 : 595 × 842 pt
const MARGIN = 45;
const FOOTER_SPACE = 55;
const GAP = 15;
const BOLD = 'Helvetica-Bold';
const REGULAR = 'Helvetica';
const ITALIC = 'Helvetica-Oblique';

/**
 * Crée le PDF et renvoie un Buffer.
 * build(doc, layout) dessine le contenu ; en-têtes de suite et pieds de page sont gérés ici.
 */
function createPdf({ title, reference, watermark = null }, build) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: MARGIN, bottom: FOOTER_SPACE, left: MARGIN, right: MARGIN },
            bufferPages: true,
            info: { Title: title, Author: COMPANY.name, Creator: COMPANY.name },
        });
        const buffers = [];
        doc.on('data', b => buffers.push(b));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const layout = {
            x: MARGIN,
            width: doc.page.width - MARGIN * 2,
            bottom: () => doc.page.height - FOOTER_SPACE,
        };

        // Pages suivantes : rappel discret du document en haut
        doc.on('pageAdded', () => {
            doc.font(REGULAR).fontSize(8).fillColor(COLORS.muted)
                .text(`${COMPANY.name}  ·  ${reference}`, layout.x, 28, { width: layout.width, lineBreak: false });
            doc.moveTo(layout.x, 42).lineTo(layout.x + layout.width, 42).lineWidth(0.5).strokeColor(COLORS.border).stroke();
            doc.y = 56;
        });

        try {
            build(doc, layout);
            drawFooters(doc, layout, watermark);
            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

/** Nouvelle page si le bloc à venir ne tient pas */
function ensureSpace(doc, layout, height) {
    if (doc.y + height > layout.bottom()) doc.addPage();
}

// ---------------------------------------------------------------------------
// En-tête : logo + coordonnées à gauche, type de document + références à droite
// ---------------------------------------------------------------------------
function drawHeader(doc, layout, { label, numero, meta = [], accent = COLORS.accent }) {
    layout.accent = accent; // couleur du document (total, titres de section)
    const top = 38;
    const logo = fs.existsSync(COMPANY.logoPath) ? COMPANY.logoPath : COMPANY.logoFallbackPath;
    try {
        if (fs.existsSync(logo)) doc.image(logo, layout.x, top, { fit: [58, 58] });
    } catch (err) {
        console.warn('[pdf] Logo non inséré :', err.message);
    }

    const tx = layout.x + 70;
    doc.font(BOLD).fontSize(14).fillColor(COLORS.text).text(COMPANY.name, tx, top + 2, { lineBreak: false });
    doc.font(REGULAR).fontSize(8.5).fillColor(COLORS.muted);
    [COMPANY.adresse, `SIRET ${COMPANY.siret}`, `${COMPANY.email}  ·  ${COMPANY.site}`].forEach((line, i) => {
        doc.text(line, tx, top + 21 + i * 11.5, { lineBreak: false });
    });

    // Bloc de droite
    const rw = 210;
    const rx = layout.x + layout.width - rw;
    doc.font(BOLD).fontSize(19).fillColor(accent).text(label, rx, top, { width: rw, align: 'right' });
    let y = top + 25;
    if (numero) {
        doc.font(BOLD).fontSize(10).fillColor(COLORS.text).text(`N° ${numero}`, rx, y, { width: rw, align: 'right' });
        y += 14;
    }
    // « Libellé : valeur » aligné à droite : la valeur (en gras) d'abord, le libellé juste à sa gauche
    meta.filter(Boolean).forEach(({ label: l, value }) => {
        doc.font(BOLD).fontSize(8.5).fillColor(COLORS.text);
        const valueW = doc.widthOfString(value);
        doc.text(value, rx, y, { width: rw, align: 'right', lineBreak: false });
        doc.font(REGULAR).fillColor(COLORS.muted).text(`${l} :`, rx, y, { width: rw - valueW - 3, align: 'right', lineBreak: false });
        y += 12;
    });

    const sepY = Math.max(top + 70, y + 6);
    doc.moveTo(layout.x, sepY).lineTo(layout.x + layout.width, sepY).lineWidth(1).strokeColor(COLORS.border).stroke();
    doc.y = sepY + 16;
}

// ---------------------------------------------------------------------------
// Encadrés « Client » et « Événement »
// ---------------------------------------------------------------------------
function drawBoxLabel(doc, text, x, y, color = COLORS.accent) {
    doc.font(BOLD).fontSize(7.5).fillColor(color).text(text.toUpperCase(), x, y, { characterSpacing: 0.8, lineBreak: false });
}

function drawParties(doc, layout, { client, eventDate, deliveryType }) {
    const boxW = (layout.width - GAP) / 2;
    const pad = 12;
    const innerW = boxW - pad * 2;
    const top = doc.y;

    const name = [client.prenom, client.nom].filter(Boolean).join(' ') || '—';
    const clientLines = [client.adresse, client.telephone, client.email].filter(v => v && v !== '-');
    const eventDateText = formatLongDate(eventDate) || 'Date à préciser';
    const showPlace = deliveryType === 'setup' || deliveryType === 'delivery';

    // Hauteurs des contenus
    doc.font(BOLD).fontSize(10.5);
    let hClient = doc.heightOfString(name, { width: innerW }) + 4;
    doc.font(REGULAR).fontSize(9);
    clientLines.forEach(l => { hClient += doc.heightOfString(l, { width: innerW }) + 2; });

    doc.font(BOLD).fontSize(10.5);
    let hEvent = doc.heightOfString(eventDateText, { width: innerW }) + 4;
    doc.font(REGULAR).fontSize(9);
    hEvent += doc.heightOfString(deliveryLabel(deliveryType), { width: innerW }) + 2;
    if (showPlace && client.adresse) hEvent += doc.heightOfString(`Lieu : ${client.adresse}`, { width: innerW }) + 2;

    const boxH = pad * 2 + 14 + Math.max(hClient, hEvent);
    ensureSpace(doc, layout, boxH + 20);
    const y0 = doc.y === top ? top : doc.y;

    [[layout.x, 'Client'], [layout.x + boxW + GAP, 'Événement']].forEach(([bx, title]) => {
        doc.roundedRect(bx, y0, boxW, boxH, 6).fill(COLORS.light);
        drawBoxLabel(doc, title, bx + pad, y0 + pad);
    });

    // Client
    let y = y0 + pad + 14;
    doc.font(BOLD).fontSize(10.5).fillColor(COLORS.text).text(name, layout.x + pad, y, { width: innerW });
    y = doc.y + 4;
    doc.font(REGULAR).fontSize(9).fillColor(COLORS.text);
    clientLines.forEach(l => { doc.text(l, layout.x + pad, y, { width: innerW }); y = doc.y + 2; });

    // Événement
    const ex = layout.x + boxW + GAP + pad;
    y = y0 + pad + 14;
    doc.font(BOLD).fontSize(10.5).fillColor(COLORS.text).text(eventDateText, ex, y, { width: innerW });
    y = doc.y + 4;
    doc.font(REGULAR).fontSize(9).fillColor(COLORS.text).text(deliveryLabel(deliveryType), ex, y, { width: innerW });
    if (showPlace && client.adresse) {
        doc.fillColor(COLORS.muted).text(`Lieu : ${client.adresse}`, ex, doc.y + 2, { width: innerW });
    }

    doc.y = y0 + boxH + 20;
}

// ---------------------------------------------------------------------------
// Tableau des articles
// ---------------------------------------------------------------------------
function tableColumns(layout) {
    const x = layout.x;
    return {
        desc: { x: x + 10, w: 285 },
        qty: { x: x + 300, w: 40 },
        pu: { x: x + 345, w: 70 },
        total: { x: x + 420, w: layout.width - 430 },
    };
}

function drawTableHeader(doc, layout, cols) {
    const y = doc.y;
    doc.roundedRect(layout.x, y, layout.width, 22, 4).fill(COLORS.accentLight);
    doc.font(BOLD).fontSize(7.5).fillColor(COLORS.text);
    const opts = { characterSpacing: 0.5, lineBreak: false };
    doc.text('DÉSIGNATION', cols.desc.x, y + 8, { ...opts, width: cols.desc.w });
    doc.text('QTÉ', cols.qty.x, y + 8, { ...opts, width: cols.qty.w, align: 'center' });
    doc.text('PRIX UNIT.', cols.pu.x, y + 8, { ...opts, width: cols.pu.w, align: 'right' });
    doc.text('TOTAL', cols.total.x, y + 8, { ...opts, width: cols.total.w, align: 'right' });
    doc.y = y + 22;
}

function packLines(p) {
    if (p.type !== 'pack' || !Array.isArray(p.produits)) return [];
    return p.produits.map(sp => `• ${sp.nom || '—'}${sp.modele ? ` (${sp.modele})` : ''} × ${sp.quantite || 1}`);
}

function drawItemsTable(doc, layout, produits) {
    const cols = tableColumns(layout);
    const pad = 7;
    ensureSpace(doc, layout, 22 + 40);
    drawTableHeader(doc, layout, cols);

    (Array.isArray(produits) ? produits : []).forEach((p, i) => {
        const nom = p.nom || '—';
        const modele = p.modele && p.modele !== '-' ? p.modele : '';
        const subs = packLines(p);
        const qty = getQty(p);
        const unit = getUnitPrice(p);

        // Hauteur de la ligne
        doc.font(BOLD).fontSize(9.5);
        let h = doc.heightOfString(nom, { width: cols.desc.w });
        doc.font(REGULAR).fontSize(8.5);
        if (modele) h += 2 + doc.heightOfString(modele, { width: cols.desc.w });
        subs.forEach(s => { h += 1.5 + doc.heightOfString(s, { width: cols.desc.w - 8 }); });
        const rowH = h + pad * 2;

        if (doc.y + rowH > layout.bottom()) {
            doc.addPage();
            drawTableHeader(doc, layout, cols);
        }

        const y = doc.y;
        if (i % 2 === 1) doc.rect(layout.x, y, layout.width, rowH).fill(COLORS.zebra);

        let ty = y + pad;
        doc.font(BOLD).fontSize(9.5).fillColor(COLORS.text).text(nom, cols.desc.x, ty, { width: cols.desc.w });
        ty = doc.y;
        if (modele) {
            doc.font(REGULAR).fontSize(8.5).fillColor(COLORS.muted).text(modele, cols.desc.x, ty + 2, { width: cols.desc.w });
            ty = doc.y;
        }
        if (subs.length) {
            doc.font(ITALIC).fontSize(8.5).fillColor(COLORS.muted);
            subs.forEach(s => {
                doc.text(s, cols.desc.x + 8, ty + 1.5, { width: cols.desc.w - 8 });
                ty = doc.y;
            });
        }

        doc.font(REGULAR).fontSize(9.5).fillColor(COLORS.text);
        doc.text(String(qty), cols.qty.x, y + pad, { width: cols.qty.w, align: 'center' });
        doc.text(formatMoney(unit), cols.pu.x, y + pad, { width: cols.pu.w, align: 'right' });
        doc.font(BOLD).text(formatMoney(unit * qty), cols.total.x, y + pad, { width: cols.total.w, align: 'right' });

        doc.moveTo(layout.x, y + rowH).lineTo(layout.x + layout.width, y + rowH).lineWidth(0.5).strokeColor(COLORS.border).stroke();
        doc.y = y + rowH;
    });

    doc.y += 14;
}

// ---------------------------------------------------------------------------
// Totaux (à droite) et modalités de paiement (à gauche)
// ---------------------------------------------------------------------------
// sign = -1 et totalLabel = 'TOTAL AVOIR' pour un avoir (montants négatifs, pas d'échéancier)
function drawTotalsAndPayment(doc, layout, { totals, eventDate, paymentTitle = 'Paiement', paymentNote, showSchedule = true, sign = 1, totalLabel = 'TOTAL' }) {
    const rightW = 230;
    const rightX = layout.x + layout.width - rightW;
    const leftW = layout.width - rightW - GAP;

    const lines = [['Matériel', totals.materiel]];
    if (totals.montage > 0) lines.push(['Montage / démontage', totals.montage]);
    if (totals.livraison > 0) lines.push(['Livraison', totals.livraison]);

    const eventShort = formatShortDate(eventDate);
    const schedule = showSchedule ? [
        [`Arrhes (${Math.round(ARRHES_RATE * 100)} %) à la réservation`, totals.arrhes],
        [eventShort ? `Solde, au plus tard le ${eventShort}` : "Solde, au plus tard le jour de l'événement", totals.solde],
    ] : [];
    if (showSchedule && totals.caution > 0) schedule.push(['Caution (restituée après la location)', totals.caution]);

    // Hauteurs
    const rightH = lines.length * 17 + 8 + 32 + 16;
    doc.font(REGULAR).fontSize(8.5);
    const noteH = paymentNote ? doc.heightOfString(paymentNote, { width: leftW - 24 }) + 6 : 0;
    const leftH = 12 + 14 + schedule.length * 17 + noteH + 8;
    ensureSpace(doc, layout, Math.max(rightH, leftH) + 10);
    const top = doc.y;

    // Totaux
    let y = top + 2;
    lines.forEach(([label, value]) => {
        doc.font(REGULAR).fontSize(9.5).fillColor(COLORS.muted).text(label, rightX + 4, y, { width: rightW - 110, lineBreak: false });
        doc.fillColor(COLORS.text).text(formatMoney(sign * value), rightX + rightW - 110, y, { width: 104, align: 'right', lineBreak: false });
        y += 17;
    });
    y += 4;
    doc.roundedRect(rightX, y, rightW, 32, 6).fill(layout.accent || COLORS.accent);
    doc.font(BOLD).fontSize(10).fillColor('#ffffff').text(totalLabel, rightX + 12, y + 11, { characterSpacing: 0.8, lineBreak: false });
    doc.fontSize(14).text(formatMoney(sign * totals.total), rightX + 100, y + 8, { width: rightW - 112, align: 'right', lineBreak: false });
    y += 38;
    doc.font(REGULAR).fontSize(7.5).fillColor(COLORS.muted).text(TVA_MENTION, rightX, y, { width: rightW, align: 'right' });

    // Paiement
    if (schedule.length || paymentNote) {
        doc.roundedRect(layout.x, top, leftW, leftH, 6).fill(COLORS.light);
        drawBoxLabel(doc, paymentTitle, layout.x + 12, top + 12);
        let ly = top + 30;
        schedule.forEach(([label, value]) => {
            doc.font(REGULAR).fontSize(9).fillColor(COLORS.text).text(label, layout.x + 12, ly, { width: leftW - 110, lineBreak: false });
            doc.font(BOLD).text(formatMoney(value), layout.x + leftW - 100, ly, { width: 88, align: 'right', lineBreak: false });
            ly += 17;
        });
        if (paymentNote) {
            doc.font(ITALIC).fontSize(8.5).fillColor(COLORS.muted).text(paymentNote, layout.x + 12, ly + 2, { width: leftW - 24 });
        }
    }

    doc.y = top + Math.max(rightH, leftH) + 14;
}

// ---------------------------------------------------------------------------
// Bouton « payer en ligne » (bon de commande)
// ---------------------------------------------------------------------------
function drawPaymentLink(doc, layout, url, label = 'Payer les arrhes en ligne') {
    if (!url) return;
    ensureSpace(doc, layout, 52);
    const y = doc.y;
    const w = 220;
    doc.roundedRect(layout.x, y, w, 30, 15).fill(COLORS.green);
    doc.font(BOLD).fontSize(10.5).fillColor('#ffffff').text(`${label}  ›`, layout.x, y + 10, { width: w, align: 'center', lineBreak: false });
    doc.link(layout.x, y, w, 30, url);
    doc.font(REGULAR).fontSize(8).fillColor(COLORS.accent)
        .text(url, layout.x + w + 12, y + 11, { width: layout.width - w - 12, link: url, underline: true, lineBreak: false, ellipsis: true });
    doc.y = y + 44;
}

// ---------------------------------------------------------------------------
// Zone de signature (devis)
// ---------------------------------------------------------------------------
function drawSignature(doc, layout, note) {
    doc.font(ITALIC).fontSize(8.5);
    const noteH = note ? doc.heightOfString(note, { width: layout.width }) + 8 : 0;
    ensureSpace(doc, layout, noteH + 86);
    if (note) {
        doc.fillColor(COLORS.muted).text(note, layout.x, doc.y, { width: layout.width });
        doc.y += 8;
    }
    const y = doc.y;
    const dateW = 150;
    const signW = layout.width - dateW - GAP;
    [[layout.x, dateW, 'Date'], [layout.x + dateW + GAP, signW, 'Signature précédée de « Bon pour accord »']].forEach(([x, w, label]) => {
        doc.roundedRect(x, y, w, 72, 6).lineWidth(0.8).dash(3, { space: 3 }).strokeColor(COLORS.muted).stroke().undash();
        drawBoxLabel(doc, label, x + 10, y + 10, COLORS.muted);
    });
    doc.y = y + 86;
}

// ---------------------------------------------------------------------------
// Sections de texte : conditions, informations
// ---------------------------------------------------------------------------
function drawSectionTitle(doc, layout, title) {
    ensureSpace(doc, layout, 40);
    doc.font(BOLD).fontSize(10).fillColor(COLORS.text).text(title, layout.x, doc.y, { width: layout.width });
    const y = doc.y + 3;
    doc.moveTo(layout.x, y).lineTo(layout.x + 30, y).lineWidth(2).strokeColor(layout.accent || COLORS.accent).stroke();
    doc.y = y + 8;
}

function drawBullets(doc, layout, items, { fontSize = 8.5, color = COLORS.text, x = layout.x, width = layout.width } = {}) {
    doc.font(REGULAR).fontSize(fontSize);
    items.forEach(item => {
        const h = doc.heightOfString(item, { width: width - 12 });
        ensureSpace(doc, layout, h + 3);
        const y = doc.y;
        doc.fillColor(COLORS.accent).text('•', x, y, { lineBreak: false });
        doc.fillColor(color).text(item, x + 12, y, { width: width - 12 });
        doc.y += 3;
    });
}

function drawConditions(doc, layout, extra = []) {
    const items = [...CONDITIONS, ...extra];
    // Bloc gardé entier : s'il ne tient pas en bas de page, il passe en entier sur la suivante
    doc.font(REGULAR).fontSize(8.5);
    const h = 30 + items.reduce((sum, it) => sum + doc.heightOfString(it, { width: layout.width - 12 }) + 3, 0);
    ensureSpace(doc, layout, h + 4);
    doc.y += 4;
    drawSectionTitle(doc, layout, 'Conditions de location');
    drawBullets(doc, layout, items, { color: COLORS.muted });
}

/** Petit texte libre (ex. mentions légales de la facture) */
function drawSmallPrint(doc, layout, text) {
    doc.font(REGULAR).fontSize(7.5);
    const h = doc.heightOfString(text, { width: layout.width });
    ensureSpace(doc, layout, h + 10);
    doc.y += 6;
    doc.fillColor(COLORS.muted).text(text, layout.x, doc.y, { width: layout.width });
}

/** Colonnes d'informations (ex. grille tarifaire sur la demande) */
function drawInfoColumns(doc, layout, groups) {
    const colW = (layout.width - GAP * (groups.length - 1)) / groups.length;
    const measure = g => {
        doc.font(BOLD).fontSize(8.5);
        let h = doc.heightOfString(g.title, { width: colW - 20 }) + 6;
        doc.font(REGULAR).fontSize(8);
        g.items.forEach(it => { h += doc.heightOfString(it, { width: colW - 20 }) + 3; });
        return h + 20;
    };
    const h = Math.max(...groups.map(measure));
    ensureSpace(doc, layout, h + 10);
    const y = doc.y;
    groups.forEach((g, i) => {
        const x = layout.x + i * (colW + GAP);
        doc.roundedRect(x, y, colW, h, 6).fill(COLORS.light);
        doc.font(BOLD).fontSize(8.5).fillColor(COLORS.text).text(g.title, x + 10, y + 10, { width: colW - 20 });
        let ty = doc.y + 6;
        doc.font(REGULAR).fontSize(8).fillColor(COLORS.muted);
        g.items.forEach(it => { doc.text(it, x + 10, ty, { width: colW - 20 }); ty = doc.y + 3; });
    });
    doc.y = y + h + 12;
}

// ---------------------------------------------------------------------------
// Pied de page sur chaque page : coordonnées + numéro de page
// ---------------------------------------------------------------------------
function drawFooters(doc, layout, watermark = null) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        // Écrire sous la marge basse sans déclencher de nouvelle page
        const bottomMargin = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        const y = doc.page.height - 38;
        doc.moveTo(layout.x, y - 8).lineTo(layout.x + layout.width, y - 8).lineWidth(0.5).strokeColor(COLORS.border).stroke();
        doc.font(REGULAR).fontSize(7.5).fillColor(COLORS.muted)
            .text(`${COMPANY.name}  ·  ${COMPANY.adresse}  ·  SIRET ${COMPANY.siret}  ·  ${COMPANY.email}`,
                layout.x, y, { width: layout.width - 60, lineBreak: false });
        doc.text(`Page ${i - range.start + 1} / ${range.count}`, layout.x + layout.width - 60, y, { width: 60, align: 'right', lineBreak: false });
        if (watermark) drawWatermark(doc, watermark);
        doc.page.margins.bottom = bottomMargin;
    }
}

/** Filigrane en diagonale (ex. « APERÇU » : document non émis) */
function drawWatermark(doc, text) {
    const cx = doc.page.width / 2;
    const cy = doc.page.height / 2;
    doc.save();
    doc.rotate(-35, { origin: [cx, cy] });
    doc.fillOpacity(0.07).font(BOLD).fontSize(110).fillColor(COLORS.text)
        .text(text, cx - 300, cy - 55, { width: 600, align: 'center', lineBreak: false });
    doc.restore();
}

module.exports = {
    createPdf,
    computeTotals,
    drawHeader,
    drawParties,
    drawItemsTable,
    drawTotalsAndPayment,
    drawPaymentLink,
    drawSignature,
    drawSectionTitle,
    drawBullets,
    drawConditions,
    drawSmallPrint,
    drawInfoColumns,
};
