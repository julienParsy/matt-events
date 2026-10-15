// backend/controllers/factureController.js
const factureService = require('../services/factureService');
const { renderDocumentPdf, renderApercuPdf, fileName } = require('../services/facturePdf');

function sendPdf(res, buffer, name, extraHeaders = {}) {
    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${name}`,
        'Content-Length': buffer.length,
        ...extraHeaders,
    });
    res.send(buffer);
}

/** GET /api/factures : liste des factures et avoirs */
async function list(req, res, next) {
    try {
        res.json(await factureService.list());
    } catch (err) { next(err); }
}

/** GET /api/factures/:id : document complet (contenu pour pré-remplir la correction) */
async function get(req, res, next) {
    try {
        const row = await factureService.get(req.params.id);
        res.json({
            id: row.id, numero: row.numero, type: row.type, statut: row.statut, date: row.created_at,
            contenu: row.contenu, origineNumero: row.origine_numero,
        });
    } catch (err) { next(err); }
}

/** GET /api/factures/:id/pdf : PDF identique à l'original */
async function pdf(req, res, next) {
    try {
        const row = await factureService.get(req.params.id);
        sendPdf(res, await renderDocumentPdf(row), fileName(row));
    } catch (err) { next(err); }
}

/** POST /api/factures/apercu : aperçu d'un contenu saisi (aucun numéro consommé) */
async function apercu(req, res, next) {
    try {
        const contenu = factureService.normalizeContenu(req.body);
        sendPdf(res, await renderApercuPdf(contenu), 'apercu_facture.pdf');
    } catch (err) { next(err); }
}

/** POST /api/factures/:id/corriger : avoir d'annulation + nouvelle facture */
async function corriger(req, res, next) {
    try {
        const { avoir, facture } = await factureService.corriger(req.params.id, req.body);
        res.status(201).json({
            avoir: { id: avoir.id, numero: avoir.numero },
            facture: { id: facture.id, numero: facture.numero },
        });
    } catch (err) { next(err); }
}

/** POST /api/factures/:id/annuler : avoir d'annulation seul */
async function annuler(req, res, next) {
    try {
        const { avoir } = await factureService.annuler(req.params.id);
        res.status(201).json({ avoir: { id: avoir.id, numero: avoir.numero } });
    } catch (err) { next(err); }
}

module.exports = { list, get, pdf, apercu, corriger, annuler, sendPdf };
