// config/constants.js
const path = require('path');

module.exports = {
    UPLOAD_DIR: path.join(__dirname, '..', 'uploads'),
    DEFAULT_PORT: 3001,
    FRONTEND_ORIGIN: 'http://localhost:5173', // à adapter
};
