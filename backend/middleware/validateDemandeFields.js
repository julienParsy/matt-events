// middlewares/validateDemandeFields.js

module.exports = function validateDemandeFields(req, res, next) {
    const { email, nom, prenom, telephone, eventDate, produits } = req.body;

    if (!email || !nom || !prenom || !telephone || !eventDate) {
        return res.status(400).json({ message: 'Champs requis manquants' });
    }

    // Vérifie que la date n’est pas antérieure à aujourd’hui
    const selectedDate = new Date(eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
        return res.status(400).json({ message: 'La date ne peut pas être antérieure à aujourd’hui.' });
    }

    // Vérifie que le panier est un tableau non vide
    if (!Array.isArray(produits) || produits.length === 0) {
        return res.status(400).json({ message: 'Le panier est vide ou invalide.' });
    }

    next(); // ✅ tous les champs sont bons
};
