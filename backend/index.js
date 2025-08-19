// index.js
const app = require('./app');
const { DEFAULT_PORT } = require('./config/constants');

const PORT = process.env.PORT || DEFAULT_PORT;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
