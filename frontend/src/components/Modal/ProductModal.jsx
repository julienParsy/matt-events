// src/components/Modal/ProductModal.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Save, Plus } from 'lucide-react';
import Modal from './Modal';
import axiosInstance from '../../services/axiosInstance';
import { uploadImage } from '../../utils/upload';
import { Alert, ImagePicker, SubmitButton, VideoListInput } from '../admin/FormControls';
import { MAX_VIDEOS, parseVideoUrls, serializeVideoUrls, validateVideos } from '../../utils/video';
import ui from '../../styles/components/AdminUI.module.css';

const EMPTY = { nom: '', modele: '', prix: '', stock: '', category_id: '', description: '' };

export default function ProductModal({ isOpen, mode, product, onClose, onSuccess }) {
    const [form, setForm] = useState(EMPTY);
    const [categories, setCategories] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const isEdit = mode === 'edit';

    useEffect(() => {
        axiosInstance.get('/categories')
            .then(res => setCategories(res.data))
            .catch(err => console.error('Erreur chargement catégories', err));
    }, []);

    useEffect(() => {
        if (isEdit && product) {
            setForm({
                nom: product.nom || '',
                modele: product.modele || '',
                prix: product.prix ?? '',
                stock: product.stock ?? '',
                category_id: product.category_id?.toString() || '',
                description: product.description || '',
            });
            setVideos(parseVideoUrls(product.video_url));
        } else {
            setForm(EMPTY);
            setVideos([]);
        }
        setImageFile(null);
        setError('');
    }, [isEdit, product]);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // Validation côté client : renvoie le premier message d'erreur, ou ''
    const validate = () => {
        if (!form.nom.trim()) return 'Le nom du produit est obligatoire.';
        if (!form.modele.trim()) return 'Le modèle est obligatoire.';
        if (!form.prix || Number(form.prix) <= 0) return 'Le prix doit être supérieur à 0.';
        if (form.stock === '' || Number(form.stock) < 0) return 'Le stock doit être renseigné (0 ou plus).';
        if (!form.category_id) return 'La catégorie est obligatoire.';
        if (!isEdit && !imageFile) return 'Veuillez sélectionner une image.';
        return validateVideos(videos);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const message = validate();
        if (message) { setError(message); return; }

        setError('');
        setLoading(true);
        try {
            let imageUrl = product?.image || '';
            if (imageFile) imageUrl = await uploadImage(imageFile);

            const payload = {
                ...form,
                prix: Number(form.prix),
                stock: Number(form.stock),
                category_id: Number(form.category_id),
                image: imageUrl,
                video_url: serializeVideoUrls(videos),
            };

            if (isEdit) {
                await axiosInstance.put(`/products/${product.id}`, payload);
            } else {
                await axiosInstance.post('/products', payload);
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue lors de l’enregistrement du produit.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            size="lg"
            title={isEdit ? 'Modifier le produit' : 'Nouveau produit'}
            subtitle={isEdit ? product?.nom : 'Ajoutez un article au catalogue.'}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className={ui.form} noValidate>
                <Alert>{error}</Alert>

                <div className={ui.field}>
                    <span className={ui.label}>Image</span>
                    <ImagePicker file={imageFile} currentUrl={product?.image || product?.image_url} onChange={setImageFile} />
                </div>

                <div className={ui.row}>
                    <div className={ui.field}>
                        <label className={ui.label} htmlFor="product-nom">Nom</label>
                        <input id="product-nom" className={ui.input} name="nom" type="text"
                            placeholder="Ex. Enceinte active 15 pouces" value={form.nom} onChange={handleChange} required />
                    </div>
                    <div className={ui.field}>
                        <label className={ui.label} htmlFor="product-modele">Modèle</label>
                        <input id="product-modele" className={ui.input} name="modele" type="text"
                            placeholder="Ex. Yamaha DXR15" value={form.modele} onChange={handleChange} required />
                    </div>
                </div>

                <div className={ui.row}>
                    <div className={ui.field}>
                        <label className={ui.label} htmlFor="product-prix">Prix (€)</label>
                        <input id="product-prix" className={ui.input} name="prix" type="number" inputMode="decimal"
                            placeholder="0,00" value={form.prix} onChange={handleChange} required min={0.01} step={0.01} />
                    </div>
                    <div className={ui.field}>
                        <label className={ui.label} htmlFor="product-stock">Stock</label>
                        <input id="product-stock" className={ui.input} name="stock" type="number" inputMode="numeric"
                            placeholder="0" value={form.stock} onChange={handleChange} required min={0} step={1} />
                    </div>
                </div>

                <div className={ui.field}>
                    <label className={ui.label} htmlFor="product-categorie">Catégorie</label>
                    <select id="product-categorie" className={ui.select} name="category_id"
                        value={form.category_id} onChange={handleChange} required>
                        <option value="">Choisir une catégorie…</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nom}</option>
                        ))}
                    </select>
                </div>

                <div className={ui.field}>
                    <label className={ui.label} htmlFor="product-video">
                        Vidéos YouTube <span className={ui.optional}>(facultatif, {MAX_VIDEOS} maximum)</span>
                    </label>
                    <VideoListInput videos={videos} onChange={setVideos} idPrefix="product-video" />
                </div>

                <div className={ui.field}>
                    <label className={ui.label} htmlFor="product-description">
                        Description <span className={ui.optional}>(facultatif)</span>
                    </label>
                    <textarea id="product-description" className={ui.textarea} name="description"
                        placeholder="Caractéristiques, conseils d’utilisation…" value={form.description} onChange={handleChange} />
                </div>

                <div className={ui.formActions}>
                    <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={onClose}>
                        Annuler
                    </button>
                    <SubmitButton loading={loading} icon={isEdit ? Save : Plus}>
                        {isEdit ? 'Enregistrer' : 'Ajouter le produit'}
                    </SubmitButton>
                </div>
            </form>
        </Modal>
    );
}

ProductModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    mode: PropTypes.oneOf(['add', 'edit']).isRequired,
    product: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
};
