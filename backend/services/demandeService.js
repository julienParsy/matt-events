const demandeModel = require('../models/demandeModel');
const {
    generatePDFAndSendEmail,
    generateDevisPDF,
    generateFacturePDF,
    generateDemandePDF
} = require('../pdf/pdfService');

async function createDemandeAndSendEmail(data) {
    const demande = await demandeModel.createDemande(data);
    const { info, pdfBuffer } = await generatePDFAndSendEmail(data);
    return { info, pdfBuffer, id: demande.id };
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

async function deleteDemande(id) {
    await demandeModel.deleteDemande(id);
}

async function generateDevis(id, frais) {
    const d = await demandeModel.getDemandeById(id);
    if (!d) throw Object.assign(new Error('Demande non trouvée'), { status: 404 });
    return generateDevisPDF({
        produits: d.produits,
        email: d.email,
        nom: d.nom,
        prenom: d.prenom,
        telephone: d.telephone,
        eventDate: d.event_date,
        deliveryType: d.deliverytype,
        frais
    });
}

async function generateFacture(id, frais) {
    const d = await demandeModel.getDemandeById(id);
    if (!d) throw Object.assign(new Error('Demande non trouvée'), { status: 404 });
    return generateFacturePDF({
        produits: d.produits,
        email: d.email,
        nom: d.nom,
        prenom: d.prenom,
        telephone: d.telephone,
        eventDate: d.event_date,
        deliveryType: d.deliverytype,
        factureNumero: `FAC${id}`,
        dateFacture: new Date().toLocaleDateString('fr-FR'),
        frais
    });
}

async function generateDemande(id) {
    const d = await demandeModel.getDemandeById(id);
    if (!d) throw Object.assign(new Error('Demande non trouvée'), { status: 404 });
    return generateDemandePDF({
        produits: d.produits,
        email: d.email,
        nom: d.nom,
        prenom: d.prenom,
        telephone: d.telephone,
        eventDate: d.event_date,
        deliveryType: d.deliverytype
    });
}

module.exports = {
    createDemandeAndSendEmail,
    getDemandeById,
    getAllDemandes,
    updateDemandeStatut,
    updateFrais,
    deleteDemande,
    generateDevis,
    generateFacture,
    generateDemande
};
