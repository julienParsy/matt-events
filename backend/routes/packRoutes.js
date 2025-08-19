// src/routes/packRoutes.js
const express = require('express');
const {
    getAllPacks,
    getPackById,
    createPack,
    updatePack,
    deletePack
} = require('../controllers/packController.js');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.get('/', getAllPacks);
router.get('/:id', getPackById);
router.post('/', verifyToken, isAdmin, createPack);
router.put('/:id', verifyToken, isAdmin, updatePack);
router.delete('/:id', verifyToken, isAdmin, deletePack);

module.exports = router;
