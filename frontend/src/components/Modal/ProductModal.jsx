// src/components/Modal/ProductModal.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import axiosInstance from '../../services/axiosInstance';
import { uploadImage } from '../../utils/upload';
import formStyles from '../../styles/components/Modal.module.css';
import btnStyles from '../../styles/components/Button.module.css';

export default function ProductModal({ isOpen, mode, product, onClose, onSuccess }) {
    const [form, setForm] = useState({
        nom: '',
        modele: '',
        prix: '',
        stock: '',
        category_id: '',
        description: '',
        video_url: ''
    });
    const [categories, setCategories] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(''); // Pour afficher les erreurs

    useEffect(() => {
        axiosInstance.get('/categories')
            .then(res => setCategories(res.data))
            .catch(err => console.error('Erreur chargement catégories', err));
    }, []);

    useEffect(() => {
        if (mode === 'edit' && product) {
            setForm({
                nom: product.nom || '',
                modele: product.modele || '',
                prix: product.prix ?? '',
                stock: product.stock ?? '',
                category_id: product.category_id?.toString() || '',
                description: product.description || '',
                video_url: product.video_url || ''
            });
            setImageFile(null);
        } else if (mode === 'add') {
            setForm({ nom: '', modele: '', prix: '', stock: '', category_id: '', description: '', video_url: '' });
            setImageFile(null);
        }
        setError('');
    }, [mode, product]);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = e => setImageFile(e.target.files[0]);

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation personnalisée
        if (!form.nom.trim()) {
            setError('Le nom du produit est obligatoire.');
            setLoading(false);
            return;
        }
        if (!form.modele.trim()) {
            setError('Le modèle est obligatoire.');
            setLoading(false);
            return;
        }
        if (!form.prix || Number(form.prix) <= 0) {
            setError('Le prix doit être supérieur à 0.');
            setLoading(false);
            return;
        }
        if (!form.stock || Number(form.stock) < 0) {
            setError('Le stock ne peut pas être négatif.');
            setLoading(false);
            return;
        }
        if (!form.category_id) {
            setError('La catégorie est obligatoire.');
            setLoading(false);
            return;
        }

        if (mode === 'add' && !imageFile) {
            setError('Veuillez sélectionner une image.');
            setLoading(false);
            return;
        }

        try {
            let imageUrl = product?.image || '';
            if (imageFile) imageUrl = await uploadImage(imageFile);

            const payload = {
                ...form,
                prix: Number(form.prix),
                stock: Number(form.stock),
                category_id: Number(form.category_id),
                image: imageUrl
            };

            if (mode === 'edit') {
                await axiosInstance.put(`/products/${product.id}`, payload);
            } else {
                await axiosInstance.post('/products', payload);
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Une erreur est survenue lors de la soumission du produit."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            title={mode === 'edit' ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                {/* Message d'erreur */}
                {error && <div style={{ color: 'red', marginBottom: '1em' }}>{error}</div>}

                <label className={formStyles.modalLabel}>
                    Nom
                    <input
                        className={formStyles.modalInput}
                        name="nom"
                        type="text"
                        placeholder="Nom du produit"
                        value={form.nom}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label className={formStyles.modalLabel}>
                    Modèle
                    <input
                        className={formStyles.modalInput}
                        name="modele"
                        type="text"
                        placeholder="Modèle"
                        value={form.modele}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label className={formStyles.modalLabel}>
                    Prix (€)
                    <input
                        className={formStyles.modalInput}
                        name="prix"
                        type="number"
                        placeholder="Prix (€)"
                        value={form.prix}
                        onChange={handleChange}
                        required
                        min={0.01}
                        step={0.01}
                    />
                </label>
                <label className={formStyles.modalLabel}>
                    Stock
                    <input
                        className={formStyles.modalInput}
                        name="stock"
                        type="number"
                        placeholder="Stock"
                        value={form.stock}
                        onChange={handleChange}
                        required
                        min={0}
                        step={1}
                    />
                </label>
                <label className={formStyles.modalLabel}>
                    Description
                    <textarea
                        className={formStyles.modalTextarea}
                        name="description"
                        placeholder="Description"
                        value={form.description}
                        onChange={handleChange}
                        // required
                    />
                </label>
                <label className={formStyles.modalLabel}>
                    Lien vidéo (URL)
                    <input
                        className={formStyles.modalInput}
                        name="video_url"
                        type="url"
                        placeholder="Lien vidéo (URL)"
                        value={form.video_url}
                        onChange={handleChange}
                        // required={mode === 'add'}
                    />
                </label>
                <label className={formStyles.modalLabel}>
                    Catégorie
                    <select
                        className={formStyles.modalSelect}
                        name="category_id"
                        value={form.category_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">-- Choisir une catégorie --</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nom}</option>
                        ))}
                    </select>
                </label>
                <label className={formStyles.modalLabel}>
                    Image
                    <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        // required uniquement en ajout
                        required={mode === 'add'}
                    />
                    <button
                        type="button"
                        className={`${btnStyles.button} ${btnStyles.btnFileUpload} ${formStyles.btnFileUpload}`}
                        onClick={() => document.getElementById('file-upload').click()}
                    >
                        {imageFile ? imageFile.name : 'Choisir un fichier'}
                    </button>
                </label>

                <div className={formStyles.modalButtons}>
                    <button
                        type="button"
                        className={formStyles.btnCancel}
                        onClick={onClose}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`${btnStyles.button} ${btnStyles.btnAjouter}`}
                    >
                        {loading ? 'Enregistrement...' : (mode === 'edit' ? 'Mettre à jour' : 'Ajouter')}
                    </button>
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
    onSuccess: PropTypes.func.isRequired
};
