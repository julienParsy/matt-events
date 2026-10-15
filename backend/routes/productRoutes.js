// backend/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { checkVideoField } = require('../utils/videoUrls');

// ✅ Validation des champs pour ajout/modification de produit
const productValidations = [
    body('nom').trim().isString().notEmpty().withMessage('Le nom est requis'),
    body('modele').trim().isString().notEmpty().withMessage('Le modèle est requis'),
    body('prix').isFloat({ gt: 0 }).withMessage('Le prix doit être un nombre positif'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Le stock doit être un entier ≥ 0'),
    body('category_id').isInt().withMessage('L’ID de catégorie doit être un entier'),
    body('image').optional().isURL().withMessage('Image doit être une URL valide'),
    body('description').optional().isString(),
    // Un ou plusieurs liens, un par ligne
    body('video_url')
        .optional({ checkFalsy: true })
        .custom(value => {
            const message = checkVideoField(value);
            if (message) throw new Error(message);
            return true;
        })
];

// ✅ Routes publiques
router.get('/grouped', productController.getGroupedProducts);
router.get('/', productController.getProducts);

// ✅ Routes protégées
router.post('/', verifyToken, isAdmin, productValidations, productController.addProduct);
router.put('/:id', verifyToken, isAdmin, productValidations, productController.updateProduct);
router.delete('/:id', verifyToken, isAdmin, productController.deleteProduct);

module.exports = router;
