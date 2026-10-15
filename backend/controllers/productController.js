// @feature catalogue — Produits (/api/products)
const productService = require('../services/productService');
const { validationResult } = require('express-validator');

/** GET /api/products */
exports.getProducts = async (req, res, next) => {
    try {
        const products = await productService.getAllProducts();
        res.json(products);
    } catch (err) {
        next(err);
    }
};

/** POST /api/products */
exports.addProduct = async (req, res, next) => {
    const errors = validationResult(req);
    // message : affiché tel quel par l'admin
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });

    try {
        const product = await productService.addProduct(req.body);
        res.status(201).json(product);
    } catch (err) {
        next(err);
    }
};

/** PUT /api/products/:id */
exports.updateProduct = async (req, res, next) => {
    const errors = validationResult(req);
    // message : affiché tel quel par l'admin
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });

    try {
        const product = await productService.updateProduct(req.params.id, req.body);
        if (!product) return res.status(404).json({ message: "Produit non trouvé" });
        res.json(product);
    } catch (err) {
        next(err);
    }
};

/** DELETE /api/products/:id */
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await productService.deleteProduct(req.params.id);
        if (!product) return res.status(404).json({ message: "Produit non trouvé" });
        res.json({ message: 'Produit supprimé', produit: product });
    } catch (err) {
        next(err);
    }
};

/** GET /api/products/grouped : produits rangés par catégorie (boutique) */
exports.getGroupedProducts = async (req, res, next) => {
    try {
        const grouped = await productService.getGroupedProducts();
        res.json(grouped);
    } catch (err) {
        next(err);
    }
};