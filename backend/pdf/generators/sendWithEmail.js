// backend/utils/sendWithEmail.js
const { sendMail } = require('../mailer');

function toNumber(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function getQty(p) { return toNumber(p?.quantite ?? p?.quantity ?? 1) || 1; }
function getUnitPrice(p) { return toNumber(p?.prix ?? p?.price ?? 0); }

async function sendWithEmail({ buffer, email, prenom, nom, telephone, produits, frais }) {
    const totalProduits = Array.isArray(produits)
        ? produits.reduce((acc, p) => acc + getUnitPrice(p) * getQty(p), 0)
        : 0;
    const totalFrais = toNumber(frais?.montage) + toNumber(frais?.livraison);
    const total = totalProduits + totalFrais;

    const dateStr = new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });

    return await sendMail({
        replyTo: email, 
        subject: "Nouvelle demande de matériel",
        text: `Une nouvelle demande de matériel a été effectuée le ${dateStr}.

Nom: ${prenom} ${nom}
Téléphone: ${telephone}
Email utilisateur: ${email}

Sous-total produits : ${totalProduits.toFixed(2)} €
${totalFrais ? `Frais : ${totalFrais.toFixed(2)} €` : ''}
Total : ${total.toFixed(2)} €

Merci de vérifier le PDF joint.`,
        html: `
      <p>Une nouvelle demande de matériel a été effectuée le ${dateStr}.</p>
      <p><strong>Nom:</strong> ${prenom} ${nom}<br/>
         <strong>Téléphone:</strong> ${telephone}<br/>
         <strong>Email utilisateur:</strong> ${email}</p>
      <p><strong>Sous-total produits :</strong> ${totalProduits.toFixed(2)} €<br/>
         ${totalFrais ? `<strong>Frais :</strong> ${totalFrais.toFixed(2)} €<br/>` : ''}
         <strong>Total :</strong> ${total.toFixed(2)} €</p>
      <p>Le PDF est en pièce jointe.</p>
    `,
        attachments: [
            { filename: `demande_${Date.now()}.pdf`, content: buffer }
        ],
    });
}

module.exports = { sendWithEmail };
