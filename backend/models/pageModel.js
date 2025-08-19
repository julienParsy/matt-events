// backend/models/Page.js

const pool = require('../config/db.js');

class Page {
    static async getBySlug(slug) {
        const result = await pool.query('SELECT * FROM pages WHERE slug = $1', [slug]);
        return result.rows[0];
    }
    static async updateBySlug(slug, { title, content }) {
        const result = await pool.query(
            'UPDATE pages SET title = $1, content = $2, updated_at = NOW() WHERE slug = $3 RETURNING *',
            [title, content, slug]
        );
        return result.rows[0];
    }
    // Optionnel: ajouter une page
    static async create({ slug, title, content }) {
        const result = await pool.query(
            'INSERT INTO pages (slug, title, content) VALUES ($1, $2, $3) RETURNING *',
            [slug, title, content]
        );
        return result.rows[0];
    }
}
module.exports = Page;
