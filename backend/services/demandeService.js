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
        adresse,
        frais: {
            montage: data.montage,
            livraison: data.livraison,
            caution: data.caution
        }
    });
}

async function generateFacture(id, data) {
    const d = await demandeModel.getDemandeById(id);
    if (!d) throw Object.assign(new Error('Demande non trouvée'), { status: 404 });

    const adresse = data.adresse || d.adresse || '-';

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
        adresse,
        frais: {
            montage: data.montage,
            livraison: data.livraison,
            caution: data.caution
        }
    });
}

// si tu veux, tu peux mettre à jour l'adresse en BDD pour garder une trace
async function updateAdresse(id, adresse) {
    await demandeModel.updateAdresse(id, adresse);
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
        deliveryType: d.deliverytype,
        adresse: d.adresse 
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
