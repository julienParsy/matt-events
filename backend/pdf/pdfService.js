// @feature pdf — Point d'entrée des générateurs de documents

const { generateDevisPDF } = require('./generators/generateDevis');
const { generateFacturePDF } = require('./generators/generateFacture');
const { generateDemandePDF } = require('./generators/generateDemande');
const { generateBonCommandePDF } = require('./generators/generateBonCommande');
const { sendWithEmail } = require('./sendWithEmail');

async function generatePDFAndSendEmail(data) {
    const pdfBuffer = await generateDemandePDF(data);
    const info = await sendWithEmail({ buffer: pdfBuffer, ...data });
    return { info, pdfBuffer };
}

module.exports = {
    generatePDFAndSendEmail,
    generateDemandePDF,
    generateDevisPDF,
    generateFacturePDF,
    generateBonCommandePDF
};