// backend/routes/packRoutes.js
const express = require('express');
const {
    getAllPacks,
    getPackById,
    createPack,
    updatePack,
    deletePack
} = require('../controllers/packController.js');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware.js');
const { validateVideoBody } = require('../utils/videoUrls');

// Colonne packs.video_url : VARCHAR(255)
const validatePackVideos = validateVideoBody({ maxLength: 255 });

const router = express.Router();

router.get('/', getAllPacks);
router.get('/:id', getPackById);
router.post('/', verifyToken, isAdmin, validatePackVideos, createPack);
router.put('/:id', verifyToken, isAdmin, validatePackVideos, updatePack);
router.delete('/:id', verifyToken, isAdmin, deletePack);

module.exports = router;
