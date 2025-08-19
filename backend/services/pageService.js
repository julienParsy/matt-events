const Page = require('../models/pageModel');

async function fetchPage(slug) {
    return Page.getBySlug(slug);
}

async function updatePage(slug, { title, content }) {
    return Page.updateBySlug(slug, { title, content });
}

async function createPage({ slug, title, content }) {
    return Page.create({ slug, title, content });
}

module.exports = { fetchPage, updatePage, createPage };
