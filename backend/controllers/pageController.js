const pageService = require('../services/pageService');

// Lecture d'une page (public)
exports.getPage = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const page = await pageService.fetchPage(slug);
        if (!page) return res.status(404).json({ message: 'Page not found' });
        res.json(page);
    } catch (err) {
        next(err);
    }
};

// Modification d'une page (admin seulement)
exports.updatePage = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { title, content } = req.body;
        if (!content) return res.status(400).json({ message: 'Le contenu est requis.' });
        const page = await pageService.updatePage(slug, { title, content });
        if (!page) return res.status(404).json({ message: 'Page not found' });
        res.json(page);
    } catch (err) {
        next(err);
    }
};

exports.createPage = async (req, res, next) => {
    try {
        const { slug, title, content } = req.body;
        if (!slug || !title || !content) {
            return res.status(400).json({ message: "Champs requis : slug, title, content" });
        }
        // Vérifier que le slug n'existe pas déjà
        const pageExist = await pageService.fetchPage(slug);
        if (pageExist) return res.status(409).json({ message: "Ce slug existe déjà." });

        const page = await pageService.createPage({ slug, title, content });
        res.status(201).json(page);
    } catch (err) {
        next(err);
    }
};
