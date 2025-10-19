const packModel = require('../models/packModel');

async function fetchAllPacks() {
    const packs = await packModel.getAllPacks();
    for (const p of packs) {
        p.produits = await packModel.getPackProducts(p.id);
    }
    return packs;
}

async function fetchPackById(id) {
    const pack = await packModel.getPackById(id);
    if (!pack) return null;
    pack.produits = await packModel.getPackProducts(id);
    return pack;
}

async function createPack(packData, produits) {
    const pack = await packModel.createPack(packData);
    for (const item of produits) {
        await packModel.insertPackProduct(pack.id, item.produit_id, item.quantite);
    }
    return pack;
}

async function updatePack(id, packData, produits) {
    await packModel.updatePack(id, packData); 
    await packModel.deletePackProducts(id);
    for (const item of produits) {
        await packModel.insertPackProduct(id, item.produit_id, item.quantite);
    }
}

async function removePack(id) {
    await packModel.deletePack(id);
}

module.exports = {
    fetchAllPacks,
    fetchPackById,
    createPack,
    updatePack,
    removePack
};
