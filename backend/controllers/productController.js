const productService = require('../services/productService');
const { validationResult } = require('express-validator');

exports.getProducts = async (req, res, next) => {
    try {
        const products = await productService.getAllProducts();
        res.json(products);
    } catch (err) {
        next(err);
    }
};

exports.addProduct = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const product = await productService.addProduct(req.body);
        res.status(201).json(product);
    } catch (err) {
        next(err);
    }
};

exports.updateProduct = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const product = await productService.updateProduct(req.params.id, req.body);
        if (!product) return res.status(404).json({ message: "Produit non trouvé" });
        res.json(product);
    } catch (err) {
        next(err);
    }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await productService.deleteProduct(req.params.id);
        if (!product) return res.status(404).json({ message: "Produit non trouvé" });
        res.json({ message: 'Produit supprimé', produit: product });
    } catch (err) {
        next(err);
    }
};

exports.getGroupedProducts = async (req, res, next) => {
    try {
        const grouped = await productService.getGroupedProducts();
        res.json(grouped);
    } catch (err) {
        next(err);
    }
};