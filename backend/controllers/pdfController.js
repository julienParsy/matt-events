const demandeService = require('../services/demandeService');
const { generateDevis, generateFacture, updateAdresse } = demandeService;

exports.createDemande = async (req, res, next) => {
    try {
        // Validation et normalisation du body
        const { client, produits, captchaToken, download } = req.body;

        // Validation robuste :
        if (!client || typeof client !== 'object')
            return res.status(400).json({ message: "Informations client manquantes !" });
        if (!produits || !Array.isArray(produits) || produits.length === 0)
            return res.status(400).json({ message: "Aucun produit sélectionné !" });

        // Regroupe tout pour le service
        const data = {
            ...client,
            adresse: client.adresse,
            produits,
            captchaToken,
            download
        };

        const { pdfBuffer } = await demandeService.createDemandeAndSendEmail(data);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=demande.pdf',
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);
    } catch (err) {
        next(err);
    }
};


exports.generateDevis = async (req, res) => {
    const { id } = req.params;
    const data = req.body; // adresse, montage, livraison, caution

    // On peut sauvegarder l'adresse si elle existe
    if (data.adresse) await updateAdresse(id, data.adresse);

    const pdfBuffer = await generateDevis(id, data);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
};

exports.generateFacture = async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    if (data.adresse) await updateAdresse(id, data.adresse);

    const pdfBuffer = await generateFacture(id, data);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
};

exports.generateDemande = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pdfBuffer = await demandeService.generateDemande(id);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=demande_${id}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);
    } catch (err) {
        next(err);
    }
};

exports.getAllDemandes = async (req, res, next) => {
    try {
        const rows = await demandeService.getAllDemandes();
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

exports.updateDemandeStatut = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;
        await demandeService.updateDemandeStatut(id, statut);
        res.json({ message: 'Statut mis à jour' });
    } catch (err) {
        next(err);
    }
};

exports.deleteDemande = async (req, res, next) => {
    try {
        const { id } = req.params;
        await demandeService.deleteDemande(id);
        res.json({ message: 'Demande supprimée' });
    } catch (err) {
        next(err);
    }
};

exports.updateFrais = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { montage = 0, livraison = 0, caution = 0 } = req.body;
        await demandeService.updateFrais(id, montage, livraison, caution);
        res.json({ message: 'Frais mis à jour avec succès' });
    } catch (err) {
        next(err);
    }
};

exports.getDemandeById = async (req, res, next) => {
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
};
