// backend/controllers/demandeController.js
const { generateBonCommandePDF } = require('../pdf/pdfService');
const demandeService = require('../services/demandeService');
const { validateClient, buildProduitsFromCatalog } = require('../services/demandeValidation');
const { generateDevis, generateFacture, updateAdresse } = demandeService;

// Fonction utilitaire pour convertir en nombre
function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

// --- CONTROLLERS ---

async function getAllDemandes(req, res, next) {
    try {
        const demandes = await demandeService.getAllDemandes();
        res.json(demandes);
    } catch (err) {
        next(err);
    }
}


// Crée une demande et envoie le PDF par email si nécessaire
async function createDemande(req, res, next) {
    try {
        const { client: rawClient, produits: rawProduits, download = true } = req.body;

        // Contrôles serveur (mêmes règles que le formulaire) et prix relus dans le catalogue :
        // le navigateur ne fournit que l'identifiant, le type et la quantité de chaque article.
        const client = validateClient(rawClient);
        const produits = await buildProduitsFromCatalog(rawProduits);

        const data = { ...client, produits, download };
        const { pdfBuffer, id } = await demandeService.createDemandeAndSendEmail(data);

        if (!pdfBuffer) return res.status(500).json({ message: "Erreur génération PDF" });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': download
                ? `attachment; filename=demande_${id}.pdf`
                : 'inline',
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);
    } catch (err) {
        next(err);
    }
}

// Génère un devis
async function generateDevisController(req, res, next) {
    try {
        const { id } = req.params;
        const data = req.body;

        if (data.adresse) await updateAdresse(id, data.adresse);

        const pdfBuffer = await generateDevis(id, data);
        if (!pdfBuffer) return res.status(500).json({ message: "Erreur génération PDF" });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=devis_${id}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);
    } catch (err) {
        next(err);
    }
}

// Génère une facture
async function generateFactureController(req, res, next) {
    try {
        const { id } = req.params;
        const data = req.body;

        const apercu = req.query.apercu === '1';

        // L'aperçu n'enregistre rien (pas même l'adresse)
        if (data.adresse && !apercu) await updateAdresse(id, data.adresse);

        const result = await generateFacture(id, data, { apercu });
        if (!result.pdfBuffer) return res.status(500).json({ message: "Erreur génération PDF" });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=${apercu ? `apercu_facture_${id}.pdf` : result.fileName}`,
            'Content-Length': result.pdfBuffer.length,
            // Facture déjà émise pour cette demande : renvoyée telle quelle (les frais saisis sont ignorés)
            ...(result.existing ? { 'X-Facture-Existante': result.numero } : {}),
        });
        res.send(result.pdfBuffer);
    } catch (err) {
        next(err);
    }
}

// Génère une demande PDF
async function generateDemande(req, res, next) {
    try {
        const { id } = req.params;
        const pdfBuffer = await demandeService.generateDemande(id);

        if (!pdfBuffer) return res.status(500).json({ message: "Erreur génération PDF" });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=demande_${id}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);
    } catch (err) {
        next(err);
    }
}

// Génère un bon de commande PDF
async function generateBonCommande(req, res) {
    try {
        const { id } = req.params;
        const { paymentLink, montage, livraison, caution } = req.body;

        if (!paymentLink) {
            return res.status(400).json({ message: "Lien de paiement manquant" });
        }

        const demande = await demandeService.getDemandeById(id);
        if (!demande) {
            return res.status(404).json({ message: "Demande introuvable" });
        }

        // Préparer l'objet à passer au PDF
        const pdfData = {
            ...demande,
            eventDate: demande.event_date,
            lienPaiement: paymentLink,
            montage: toNumber(montage),
            livraison: toNumber(livraison),
            caution: toNumber(caution),
            deliveryType: demande.deliverytype
        };

        const pdfBuffer = await generateBonCommandePDF(pdfData);
        if (!pdfBuffer) return res.status(500).json({ message: "Erreur génération PDF" });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=bon_commande_${id}.pdf`
        });
        res.send(pdfBuffer);
    } catch (err) {
        console.error("Erreur generateBonCommande :", err);
        res.status(500).json({ message: "Erreur lors de la génération du bon de commande" });
    }
}

// Met à jour le statut d'une demande
async function updateDemandeStatut(req, res, next) {
    try {
        const { id } = req.params;
        const { statut } = req.body;
        await demandeService.updateDemandeStatut(id, statut);
        res.json({ message: 'Statut mis à jour' });
    } catch (err) {
        next(err);
    }
}

// Supprime une demande
async function deleteDemande(req, res, next) {
    try {
        const { id } = req.params;
        await demandeService.deleteDemande(id);
        res.json({ message: 'Demande supprimée' });
    } catch (err) {
        next(err);
    }
}

// Met à jour les frais
async function updateFrais(req, res, next) {
    try {
        const { id } = req.params;
        const { montage = 0, livraison = 0, caution = 0 } = req.body;
        await demandeService.updateFrais(id, montage, livraison, caution);
        res.json({ message: 'Frais mis à jour avec succès' });
    } catch (err) {
        next(err);
    }
}

// Récupère une demande par ID
async function getDemandeById(req, res, next) {
    try {
        const { id } = req.params;
        const demande = await demandeService.getDemandeById(id);
        if (!demande) {
            return res.status(404).json({ message: 'Demande non trouvée' });
        }
        res.json(demande);
    } catch (err) {
        next(err);
    }
}

// --- EXPORTS ---
module.exports = {
    createDemande,
    generateDevis: generateDevisController,
    generateFacture: generateFactureController,
    generateDemande,
    generateBonCommande,
    updateDemandeStatut,
    deleteDemande,
    updateFrais,
    getDemandeById,
    getAllDemandes
};
