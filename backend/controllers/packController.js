// @feature catalogue — Packs (/api/packs)
const packService = require('../services/packService');

/** GET /api/packs */
exports.getAllPacks = async (req, res, next) => {
    try {
        const packs = await packService.fetchAllPacks();
        res.json(packs);
    } catch (err) {
        next(err);
    }
};

/** GET /api/packs/:id */
exports.getPackById = async (req, res, next) => {
    try {
        const pack = await packService.fetchPackById(req.params.id);
        if (!pack) return res.status(404).json({ message: 'Pack non trouvé' });
        res.json(pack);
    } catch (err) {
        next(err);
    }
};

/** POST /api/packs */
exports.createPack = async (req, res, next) => {
    try {
        const { nom, description, prix, image_url, produits, stock, sous_categorie_id, video_url } = req.body;
        if (!nom || !produits || !prix || !stock) {
            return res.status(400).json({ message: 'Champs obligatoires manquants' });
        }
        const pack = await packService.createPack(
            { nom, description, prix, image_url, stock, sous_categorie_id, video_url },
            produits
        );
        res.status(201).json(pack);
    } catch (err) {
        next(err);
    }
};

/** PUT /api/packs/:id */
exports.updatePack = async (req, res, next) => {
    try {
        const { nom, description, prix, image_url, produits, stock, sous_categorie_id, video_url } = req.body;
        await packService.updatePack(
            req.params.id,
            { nom, description, prix, image_url, stock, sous_categorie_id, video_url },
            produits
        );
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
};

/** DELETE /api/packs/:id */
exports.deletePack = async (req, res, next) => {
    try {
        await packService.removePack(req.params.id);
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
};
