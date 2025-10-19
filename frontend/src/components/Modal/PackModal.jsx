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
        produits: [],
        stock: '',
        sous_categorie_id: ''
    });

    const [products, setProducts] = useState([]);
    const [sousCategories, setSousCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [selectedProdId, setSelectedProdId] = useState('');
    const [selectedProdQty, setSelectedProdQty] = useState(1);
    const [error, setError] = useState('');

    useEffect(() => {
        axiosInstance.get('/products')
            .then(res => setProducts(res.data))
            .catch(err => console.error('Erreur chargement produits', err));
    }, []);

    useEffect(() => {
        axiosInstance.get('/sous-categories')
            .then(res => setSousCategories(res.data))
            .catch(err => console.error('Erreur chargement sous-catégories', err));
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
                })),
                stock: pack.stock || '',
                sous_categorie_id: pack.sous_categorie_id || ''
            });
            setImageFile(null);
        } else if (mode === 'add') {
            setForm({
                nom: '',
                description: '',
                prix: '',
                image_url: '',
                produits: [],
                stock: '',
                sous_categorie_id: ''
            });
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

    const addProductToForm = () => {
        if (!selectedProdId) return;

        const prod = products.find(p => p.id === selectedProdId);
        if (!prod) return;

        const stock = prod.stock ?? 1;
        let qty = selectedProdQty;
        if (qty < 1) qty = 1;
        if (qty > stock) {
            setError(`Stock insuffisant pour ${prod.nom} — ${prod.modele} (max: ${stock})`);
            return;
        }

        setForm(prev => {
            const existing = prev.produits.find(p => p.produit_id === selectedProdId);
            let newProduits;
            if (existing) {
                newProduits = prev.produits.map(p =>
                    p.produit_id === selectedProdId
                        ? { ...p, quantite: qty }
                        : p
                );
            } else {
                newProduits = [...prev.produits, { produit_id: selectedProdId, quantite: qty }];
            }

            const descList = newProduits
                .map(item => {
                    const p2 = products.find(p => p.id === item.produit_id);
                    return p2 ? `- ${p2.nom} — ${p2.modele} × ${item.quantite}` : '';
                })
                .join('\n');

            return { ...prev, produits: newProduits, description: descList };
        });

        setSelectedProdId('');
        setSelectedProdQty(1);
        setError('');
    };

    const removeProductFromForm = produit_id => {
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
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);

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
        if (!form.stock || Number(form.stock) < 0) {
            setError('Le stock doit être renseigné et supérieur ou égal à 0.');
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
                stock: Number(form.stock),
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
                        value={form.stock}
                        onChange={handleChange}
                        required
                        min={0}
                    />
                </label>

                <label className={formStyles.modalLabel}>
                    Sous-catégorie
                    <select
                        className={formStyles.modalSelect}
                        name="sous_categorie_id"
                        value={form.sous_categorie_id || ''}
                        onChange={handleChange}
                        required
                    >
                        <option value="">— Choisir une sous-catégorie —</option>
                        {sousCategories.map(sc => (
                            <option key={sc.id} value={sc.id}>
                                {sc.nom}
                            </option>
                        ))}
                    </select>
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
                        {imageFile ? imageFile.name : form.image_url ? 'Image actuelle' : 'Choisir un fichier'}
                    </button>
                </div>

                {/* Sélection des produits */}
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
                            max={selectedProdId
                                ? products.find(p => p.id === selectedProdId)?.stock ?? 1
                                : 1}
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
                                (selectedProdId && selectedProdQty > (products.find(p => p.id === selectedProdId)?.stock ?? 1))
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
                            const stock = prod?.stock ?? 1;

                            return (
                                <li key={produit_id} className={listProductsStyles.productListItem}>
                                    <span>{prod ? `${prod.nom} — ${prod.modele}` : 'Produit inconnu'}</span>

                                    {/* Modification directe de la quantité */}
                                    <input
                                        type="number"
                                        min="1"
                                        max={stock}
                                        value={quantite}
                                        onChange={e => {
                                            let newQty = Number(e.target.value);
                                            if (newQty < 1) newQty = 1;
                                            if (newQty > stock) newQty = stock;

                                            setForm(prev => {
                                                const updated = prev.produits.map(p =>
                                                    p.produit_id === produit_id ? { ...p, quantite: newQty } : p
                                                );

                                                const descList = updated
                                                    .map(item => {
                                                        const p2 = products.find(p => p.id === item.produit_id);
                                                        return p2 ? `- ${p2.nom} — ${p2.modele} × ${item.quantite}` : '';
                                                    })
                                                    .join('\n');

                                                return { ...prev, produits: updated, description: descList };
                                            });
                                        }}
                                        className={formStyles.productQty}
                                    />

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
                    <button type="button" className={formStyles.btnCancel} onClick={onClose}>
                        Annuler
                    </button>
                    <button type="submit" disabled={loading} className={`${btnStyles.button} ${btnStyles.btnNew}`}>
                        {loading ? 'Enregistrement...' : mode === 'edit' ? 'Mettre à jour' : 'Ajouter'}
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
