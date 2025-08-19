const path = require('path');

const COMPANY = {
    name: "MATT'EVENTS",
    adresse: "57 rue Hubert Parent prolongée, 59171 Erre",
    siret: "989 427 158 00013",
    email: "contact@mattevents.fr",
    logoPath: path.join(__dirname, '..', 'assets', 'logo.png')
};

const TVA_MENTION = "TVA non applicable, art. 293 B du CGI";

module.exports = {
    COMPANY,
    TVA_MENTION
};