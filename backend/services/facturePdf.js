// @feature factures, pdf
// PDF d'une facture ou d'un avoir à partir de son contenu enregistré (toujours identique).
const { generateFacturePDF } = require('../pdf/generators/generateFacture');
const { generateAvoirPDF } = require('../pdf/generators/generateAvoir');

const contenuArgs = c => ({
    ...c.client,
    eventDate: c.eventDate,
    deliveryType: c.deliveryType,
    produits: c.produits,
    frais: c.frais,
    demandeNumero: c.demandeNumero,
});

/** row : ligne de la table factures (avec contenu, origine_numero, origine_date) */
function renderDocumentPdf(row) {
    if (row.type === 'avoir') {
        return generateAvoirPDF({
            ...contenuArgs(row.contenu),
            avoirNumero: row.numero,
            dateAvoir: row.created_at,
            factureNumero: row.origine_numero,
            dateFacture: row.origine_date,
        });
    }
    return generateFacturePDF({
        ...contenuArgs(row.contenu),
        factureNumero: row.numero,
        dateFacture: row.created_at,
        remplaceNumero: row.origine_numero,
    });
}

/** Aperçu sans numéro (filigrane « APERÇU »), rien n'est enregistré */
function renderApercuPdf(contenu) {
    return generateFacturePDF({ ...contenuArgs(contenu), apercu: true });
}

const fileName = row => `${row.type === 'avoir' ? 'avoir' : 'facture'}_${row.numero}.pdf`;

module.exports = { renderDocumentPdf, renderApercuPdf, fileName };
