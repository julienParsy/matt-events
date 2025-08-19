const packService = require('../services/packService');

// Récupérer tous les packs
exports.getAllPacks = async (req, res, next) => {
    try {
        const packs = await packService.fetchAllPacks();
        res.json(packs);
    } catch (err) {
        next(err);
    }
};

// Récupérer un pack par son ID
exports.getPackById = async (req, res, next) => {
    try {
        const pack = await packService.fetchPackById(req.params.id);
        if (!pack) return res.status(404).json({ message: 'Pack non trouvé' });
        res.json(pack);
    } catch (err) {
        next(err);
    }
};

// Créer un pack
exports.createPack = async (req, res, next) => {
    try {
        const { nom, description, prix, image_url, produits, stock } = req.body;
        if (!nom || !produits || !prix || !stock) {
            return res.status(400).json({ message: 'Champs obligatoires manquants' });
        }
        const pack = await packService.createPack(
            { nom, description, prix, image_url, stock },
            produits
        );
        res.status(201).json(pack);
    } catch (err) {
        next(err);
    }
};

// Mettre à jour un pack
exports.updatePack = async (req, res, next) => {
    try {
        const { nom, description, prix, image_url, produits, stock } = req.body;
        await packService.updatePack(
            req.params.id,
            { nom, description, prix, image_url, stock },
            produits
        );
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
};

// Supprimer un pack
exports.deletePack = async (req, res, next) => {
    try {
        await packService.removePack(req.params.id);
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
};
