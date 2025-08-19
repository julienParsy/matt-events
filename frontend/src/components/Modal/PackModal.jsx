// src/components/PackModal.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { uploadImage } from '../../utils/upload';
import Modal from './Modal';
import axiosInstance from '../../services/axiosInstance';
import formStyles from '../../styles/components/Modal.module.css';
import listProductsStyles from '../../styles/components/CategoryList.module.css';
import btnStyles from '../../styles/components/Button.module.css';

export default function PackModal({ isOpen, mode, pack, onClose, onSuccess }) {
    const [form, setForm] = useState({
        nom: '',
        description: '',
        prix: '',
        image_url: '',
        produits: []
    });
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [selectedProdId, setSelectedProdId] = useState('');
    const [selectedProdQty, setSelectedProdQty] = useState(1);
    const [error, setError] = useState(''); // Pour afficher les erreurs

    useEffect(() => {
        axiosInstance.get('/products')
            .then(res => setProducts(res.data))
            .catch(err => console.error('Erreur chargement produits', err));
    }, []);

    useEffect(() => {
        if (mode === 'edit' && pack) {
            setForm({
                nom: pack.nom || '',
                description: pack.description || '',
                prix: pack.prix?.toString() || '',
                image_url: pack.image_url || '',
                produits: pack.produits.map(p => ({
                    produit_id: p.id,
                    quantite: p.quantite
                }))
            });
            setImageFile(null);
        } else if (mode === 'add') {
            setForm({ nom: '', description: '', prix: '', image_url: '', produits: [] });
            setImageFile(null);
        }
        setError('');
    }, [mode, pack]);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = e => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    function addProductToForm() {
        const prod = products.find(p => p.id === selectedProdId);
        if (!prod) return;
        const stock = prod.stock ?? 1;
        const totalAsked = selectedProdQty;

        if (totalAsked > stock) {
            setError(`Stock insuffisant pour ${prod.nom} — ${prod.modele} (max: ${stock})`);
            return;
        }
        setForm(prev => {
            const others = prev.produits.filter(p => p.produit_id !== selectedProdId);
            const newProduits = [
                ...others,
                { produit_id: selectedProdId, quantite: totalAsked }
            ];
            const descList = newProduits
                .map(item => {
                    const prod2 = products.find(p => p.id === item.produit_id);
                    return prod2 ? `- ${prod2.nom} — ${prod2.modele} × ${item.quantite}` : '';
                })
                .join('\n');
            return { ...prev, produits: newProduits, description: descList };
        });
        setSelectedProdId('');
        setSelectedProdQty(1);
        setError('');
    }

    function removeProductFromForm(produit_id) {
        setForm(prev => {
            const filtered = prev.produits.filter(p => p.produit_id !== produit_id);
            const descList = filtered
                .map(item => {
                    const prod = products.find(p => p.id === item.produit_id);
                    return prod ? `- ${prod.nom} — ${prod.modele} × ${item.quantite}` : '';
                })
                .join('\n');
            return { ...prev, produits: filtered, description: descList };
        });
    }

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation personnalisée
        if (!form.nom.trim()) {
            setError('Le nom du pack est obligatoire.');
            setLoading(false);
            return;
        }
        if (!form.prix || Number(form.prix) <= 0) {
            setError('Le prix doit être supérieur à 0.');
            setLoading(false);
            return;
        }
        if (form.produits.length === 0) {
            setError('Veuillez ajouter au moins un produit au pack.');
            setLoading(false);
            return;
        }
        if (mode === 'add' && !imageFile) {
            setError('Veuillez sélectionner une image pour le pack.');
            setLoading(false);
            return;
        }

        try {
            let imageUrl = form.image_url || '';
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }

            const payload = {
                ...form,
                prix: Number(form.prix),
                image_url: imageUrl,
                produits: form.produits
            };

            if (mode === 'edit') {
                await axiosInstance.put(`/packs/${pack.id}`, payload);
            } else {
                await axiosInstance.post('/packs', payload);
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Une erreur est survenue lors de la soumission du pack."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            title={mode === 'edit' ? 'Modifier le Pack' : 'Ajouter un Pack'}
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
                        value={form.nom}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label className={formStyles.modalLabel}>
                    Description
                    <textarea
                        className={formStyles.modalTextarea}
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                    />
                </label>
                <label className={formStyles.modalLabel}>
                    Prix (€)
                    <input
                        className={formStyles.modalInput}
                        name="prix"
                        type="number"
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
                        value={form.stock || ''}
                        onChange={e => handleChange({ target: { name: 'stock', value: e.target.value } })}
                        required
                    />
                </label>
                <label className={formStyles.modalLabel}>
                    Image
                    <input
                        id="pack-file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        required={mode === 'add'}
                    />
                </label>
                <div className={formStyles.modalInput}>
                    <button
                        type="button"
                        className={`${btnStyles.button} ${btnStyles.btnFileUpload}`}
                        onClick={() => document.getElementById('pack-file-upload').click()}
                    >
                        {imageFile
                            ? imageFile.name
                            : form.image_url
                                ? 'Image actuelle'
                                : 'Choisir un fichier'}
                    </button>
                </div>

                <section className={formStyles.modalLabel}>
                    <h4>Sélectionner les produits</h4>
                    <div className={formStyles.productSelector}>
                        <select
                            value={selectedProdId}
                            onChange={e => {
                                setSelectedProdId(Number(e.target.value));
                                setSelectedProdQty(1);
                            }}
                            className={formStyles.modalSelect}
                        >
                            <option value="">— Choisir un produit —</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nom} — {p.modele} (stock: {p.stock ?? 'N/A'})
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            min="1"
                            max={
                                selectedProdId
                                    ? products.find(p => p.id === selectedProdId)?.stock ?? 1
                                    : 1
                            }
                            value={selectedProdQty}
                            onChange={e => {
                                const prod = products.find(p => p.id === selectedProdId);
                                const stock = prod?.stock ?? 1;
                                let qty = Number(e.target.value);
                                if (qty > stock) qty = stock;
                                if (qty < 1) qty = 1;
                                setSelectedProdQty(qty);
                            }}
                            className={formStyles.modalInput}
                            disabled={!selectedProdId}
                        />

                        <button
                            type="button"
                            className={`${btnStyles.button} ${btnStyles.btnMoreArticles}`}
                            onClick={addProductToForm}
                            disabled={
                                !selectedProdId ||
                                selectedProdQty < 1 ||
                                (selectedProdId &&
                                    selectedProdQty > (products.find(p => p.id === selectedProdId)?.stock ?? 1))
                            }
                        >
                            Ajouter
                        </button>
                        {selectedProdId && (
                            <span style={{ fontSize: '0.85em', color: '#888', marginLeft: 6 }}>
                                (max: {products.find(p => p.id === selectedProdId)?.stock ?? 1})
                            </span>
                        )}
                    </div>

                    <ul className={listProductsStyles.productList}>
                        {form.produits.map(({ produit_id, quantite }) => {
                            const prod = products.find(p => p.id === produit_id);
                            return (
                                <li key={produit_id} className={listProductsStyles.productListItem}>
                                    <span>
                                        {prod
                                            ? `${prod.nom} — ${prod.modele}`
                                            : 'Produit inconnu'}
                                    </span>
                                    <span className={formStyles.productQty}>× {quantite}</span>
                                    <button
                                        type="button"
                                        className={`${btnStyles.button} ${btnStyles.supprimer}`}
                                        onClick={() => removeProductFromForm(produit_id)}
                                        aria-label={`Supprimer ${prod ? prod.nom : 'produit inconnu'}`}
                                    >
                                        ✕
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>

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
                        className={`${btnStyles.button} ${btnStyles.btnNew}`}
                    >
                        {loading
                            ? 'Enregistrement...'
                            : (mode === 'edit' ? 'Mettre à jour' : 'Ajouter')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

PackModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    mode: PropTypes.oneOf(['add', 'edit']).isRequired,
    pack: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired
};
