// @feature demandes — Logique des demandes : enregistrement, devis, facture, bon de commande
const demandeModel = require('../models/demandeModel');
const factureService = require('./factureService');
const { renderDocumentPdf, renderApercuPdf, fileName } = require('./facturePdf');
const {
    generatePDFAndSendEmail,
    generateDevisPDF,
    generateDemandePDF
} = require('../pdf/pdfService');

async function createDemandeAndSendEmail(data) {
    const demande = await demandeModel.createDemande(data);
    try {
        const { info, pdfBuffer } = await generatePDFAndSendEmail({
            ...data,
            demandeNumero: demande.id,
            dateDemande: demande.created_at,
        });
        return { info, pdfBuffer, id: demande.id };
    } catch (err) {
        // Évite les doublons : le client réessaiera depuis son panier.
        await demandeModel.deleteDemande(demande.id).catch((e) =>
            console.error('Rollback de la demande impossible :', e)
        );
        throw err;
    }
}

async function getDemandeById(id) {
    return demandeModel.getDemandeById(id);
}

async function getAllDemandes() {
    return demandeModel.getAllDemandes();
}

async function updateDemandeStatut(id, statut) {
    await demandeModel.updateDemandeStatut(id, statut);
}

async function updateFrais(id, montage, livraison, caution) {
    await demandeModel.updateFrais(id, montage, livraison, caution);
}

// Adresse saisie dans l'admin, conservée sur la demande
async function updateAdresse(id, adresse) {
    await demandeModel.updateAdresse(id, adresse);
}

async function deleteDemande(id) {
    await demandeModel.deleteDemande(id);
}

async function generateDevis(id, data) {
    const d = await demandeModel.getDemandeById(id);
    if (!d) throw Object.assign(new Error('Demande non trouvée'), { status: 404 });

    // Priorité à l'adresse passée depuis le formulaire admin, sinon à celle stockée
    const adresse = data.adresse || d.adresse || '-';

    return generateDevisPDF({
        produits: d.produits,
        email: d.email,
        nom: d.nom,
        prenom: d.prenom,
        telephone: d.telephone,
        eventDate: d.event_date,
        deliveryType: d.deliverytype,
        devisNumero: `${id}`,
        adresse,
        frais: {
            montage: data.montage,
            livraison: data.livraison,
            caution: data.caution
        }
    });
}

// Facture d'une demande : émise une seule fois (contenu figé), puis retéléchargée à l'identique.
// options.apercu : PDF « APERÇU » sans numéro, rien n'est enregistré.
async function generateFacture(id, data, { apercu = false } = {}) {
    if (apercu) {
        const contenu = await factureService.apercuPourDemande(id, data);
        return { pdfBuffer: await renderApercuPdf(contenu), apercu: true };
    }
    const { row, existing } = await factureService.emettrePourDemande(id, data);
    return { pdfBuffer: await renderDocumentPdf(row), numero: row.numero, fileName: fileName(row), existing };
}

async function generateDemande(id) {
    const d = await demandeModel.getDemandeById(id);
    if (!d) throw Object.assign(new Error('Demande non trouvée'), { status: 404 });

    const adresse = d.adresse || '-';

    return generateDemandePDF({
        produits: d.produits,
        email: d.email,
        nom: d.nom,
        prenom: d.prenom,
        telephone: d.telephone,
        eventDate: d.event_date,
        deliveryType: d.deliverytype,
        demandeNumero: `${id}`,
        dateDemande: d.created_at,
        adresse,
        frais: {
            montage: d.montage,
            livraison: d.livraison,
            caution: d.caution
        },
    });
}

module.exports = {
    createDemandeAndSendEmail,
    getDemandeById,
    getAllDemandes,
    updateAdresse,
    updateDemandeStatut,
    updateFrais,
    deleteDemande,
    generateDevis,
    generateFacture,
    generateDemande
};