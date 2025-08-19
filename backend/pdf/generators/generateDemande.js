const PDFDocument = require('pdfkit');
const { generateBasePDF } = require('./generateBasePDF');
const { addHeader, drawSectionTitle, drawBulletList } = require('../pdfHelpers'); // Assure-toi que ces helpers sont importés

function generateDemandePDF(args) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Page principale (infos client, tableau, total, ...), custom layout, pas de customConditionsText ici
        const totalTableWidth = 440; // à adapter selon ton layout
        generateBasePDF(doc, {
            ...args,
            titre: 'Demande de location',
            couleurTitre: '#007ACC',
            couleurTotal: '#007ACC',
            showConditions: false, // on gère les conditions nous-même sur nouvelle page
            includeCaution: false,
            dateLabel: `Du ${new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}`
        });

        // === NOUVELLE PAGE POUR LES DÉTAILS ===
        doc.addPage();
        doc.moveDown(1);
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#007ACC')
            .text("Détails - Retrait, Livraison et Montage/Démontage",
                doc.page.margins.left, doc.y, { align: 'center', width: 440, underline: true });

        doc.moveDown(1);

        drawSectionTitle(doc, "RETRAIT & LIVRAISON");
        drawBulletList(doc, [
            "Retrait sur place (uniquement sur rendez-vous à Erre - 59171)",
            "Livraison avec installation (sur devis selon distance et prestation)"
        ]);

        drawSectionTitle(doc, "FRAIS DE MONTAGE / DÉMONTAGE");
        drawBulletList(doc, [
            "Petite installation : 2 enceintes + jeux de lumière simples — 30 €",
            "Installation moyenne : Sonorisation + lumières + structure légère — 50 à 90 €",
            "Grosse installation : Pack complet (pont, plusieurs effets, etc.) — 100 à 200 €",
            "Le tarif exact est établi en fonction du lieu et du matériel utilisé."
        ]);

        drawSectionTitle(doc, "TARIFS DE LIVRAISON (aller-retour)");
        drawBulletList(doc, [
            "Jusqu’à 15 km : 5 €",
            "De 15 à 30 km : 20 €",
            "De 30 à 50 km : 35 €",
            "De 50 à 80 km : 50 €",
            "Au-delà : 0,80 €/km"
        ]);

        drawSectionTitle(doc, "CAUTION");
        drawBulletList(doc, [
            "Une caution est demandée selon le type de matériel loué : de 30 € à 800 €",
            "Caution rendue à la restitution du matériel, sous réserve de bon état",
            "Moyens de paiement acceptés : espèces, virement, carte, chèques (avec pièce d’identité)"
        ]);

        doc.end();
    });
}

module.exports = { generateDemandePDF };
