// backend/pdf/pdfService.js

const { generateDevisPDF } = require('./generators/generateDevis');
const { generateFacturePDF } = require('./generators/generateFacture');
const { generateDemandePDF } = require('./generators/generateDemande');
const { sendWithEmail } = require('./generators/sendWithEmail');

async function generatePDFAndSendEmail(data) {
    const pdfBuffer = await generateDemandePDF(data);
    const info = await sendWithEmail({ buffer: pdfBuffer, ...data });
    return { info, pdfBuffer };
}

module.exports = {
    generatePDFAndSendEmail,
    generateDemandePDF,
    generateDevisPDF,
    generateFacturePDF
};