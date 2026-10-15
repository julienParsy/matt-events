// src/components/admin/PackModal.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Save, Plus, Trash2, PackagePlus } from 'lucide-react';
import { uploadImage } from '../../utils/upload';
import Modal from '../ui/Modal';
import axiosInstance from '../../services/axiosInstance';
import { Alert, ImagePicker, SubmitButton, VideoListInput } from './FormControls';
import { parseVideoUrls, serializeVideoUrls, validateVideos } from '../../utils/video';
import ui from '../../styles/components/AdminUI.module.css';
import styles from '../../styles/components/PackModal.module.css';

const EMPTY = {
    nom: '',
    description: '',
    prix: '',
    image_url: '',
    produits: [],
    stock: '',
    sous_categorie_id: '',
};

// Colonne packs.video_url en base : VARCHAR(255)
const PACK_VIDEO_MAX_LENGTH = 255;

export default function PackModal({ isOpen, mode, pack, onClose, onSuccess }) {
    const [form, setForm] = useState(EMPTY);
    const [products, setProducts] = useState([]);
    const [sousCategories, setSousCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [videos, setVideos] = useState([]);
    const [selectedProdId, setSelectedProdId] = useState('');
    const [selectedProdQty, setSelectedProdQty] = useState(1);
    const [error, setError] = useState('');
    const isEdit = mode === 'edit';

    useEffect(() => {
        axiosInstance.get('/products')
            .then(res => setProducts(res.data))
            .catch(err => console.error('Erreur chargement produits', err));
        axiosInstance.get('/sous-categories')
            .then(res => setSousCategories(res.data))
            .catch(err => console.error('Erreur chargement sous-catégories', err));
    }, []);

    useEffect(() => {
        if (isEdit && pack) {
            setForm({
                nom: pack.nom || '',
                description: pack.description || '',
                prix: pack.prix?.toString() || '',
                image_url: pack.image_url || '',
                produits: (pack.produits || []).map(p => ({ produit_id: p.id, quantite: p.quantite })),
                // ?? et non || : un stock de 0 est une valeur valide
                stock: pack.stock ?? '',
                sous_categorie_id: pack.sous_categorie_id ?? '',
            });
            // auparavant oublié : la vidéo était effacée à chaque modification
            setVideos(parseVideoUrls(pack.video_url));
        } else {
            setForm(EMPTY);
            setVideos([]);
        }
        setImageFile(null);
        setError('');
    }, [isEdit, pack]);

    const findProduct = id => products.find(p => p.id === id);
    const stockOf = id => findProduct(id)?.stock ?? 1;

    // La description reprend la liste des produits (format lu par l'overlay du site)
    const describe = produits => produits
        .map(item => {
            const p = findProduct(item.produit_id);
            return p ? `- ${p.nom} — ${p.modele} × ${item.quantite}` : '';
        })
        .filter(Boolean)
        .join('\n');

    const setProduits = updater => setForm(prev => {
        const produits = updater(prev.produits);
        return { ...prev, produits, description: describe(produits) };
    });

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const addProduct = () => {
        const prod = findProduct(selectedProdId);
        if (!prod) return;
        const qty = Math.max(1, selectedProdQty);
        if (qty > stockOf(selectedProdId)) {
            setError(`Stock insuffisant pour ${prod.nom} — ${prod.modele} (max : ${stockOf(selectedProdId)}).`);
            return;
        }
        setProduits(list => (list.some(p => p.produit_id === selectedProdId)
            ? list.map(p => (p.produit_id === selectedProdId ? { ...p, quantite: qty } : p))
            : [...list, { produit_id: selectedProdId, quantite: qty }]));
        setSelectedProdId('');
        setSelectedProdQty(1);
        setError('');
    };

    const updateQty = (produit_id, value) => {
        const qty = Math.min(Math.max(1, Number(value) || 1), stockOf(produit_id));
        setProduits(list => list.map(p => (p.produit_id === produit_id ? { ...p, quantite: qty } : p)));
    };

    const removeProduct = produit_id => setProduits(list => list.filter(p => p.produit_id !== produit_id));

    const validate = () => {
        if (!form.nom.trim()) return 'Le nom du pack est obligatoire.';
        if (!form.prix || Number(form.prix) <= 0) return 'Le prix doit être supérieur à 0.';
        if (form.stock === '' || Number(form.stock) < 0) return 'Le stock doit être renseigné (0 ou plus).';
        if (!form.sous_categorie_id) return 'La sous-catégorie est obligatoire.';
        if (form.produits.length === 0) return 'Ajoutez au moins un produit au pack.';
        if (!isEdit && !imageFile) return 'Veuillez sélectionner une image pour le pack.';
        return validateVideos(videos, { maxLength: PACK_VIDEO_MAX_LENGTH });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const message = validate();
        if (message) { setError(message); return; }

        setError('');
        setLoading(true);
        try {
            let imageUrl = form.image_url || '';
            if (imageFile) imageUrl = await uploadImage(imageFile);

            const payload = {
                ...form,
                prix: Number(form.prix),
                stock: Number(form.stock),
                image_url: imageUrl,
                video_url: serializeVideoUrls(videos),
            };

            if (isEdit) {
                await axiosInstance.put(`/packs/${pack.id}`, payload);
            } else {
                await axiosInstance.post('/packs', payload);
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue lors de l’enregistrement du pack.');
        } finally {
            setLoading(false);
        }
    };

    const maxQty = selectedProdId ? stockOf(selectedProdId) : 1;

    return (
        <Modal
            isOpen={isOpen}
            size="lg"
            title={isEdit ? 'Modifier le pack' : 'Nouveau pack'}
            subtitle={isEdit ? pack?.nom : 'Composez un pack à partir de vos produits.'}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className={ui.form} noValidate>
                <Alert>{error}</Alert>

                <div className={ui.field}>
                    <span className={ui.label}>Image</span>
                    <ImagePicker file={imageFile} currentUrl={form.image_url} onChange={setImageFile} />
                </div>

                <div className={ui.field}>
                    <label className={ui.label} htmlFor="pack-nom">Nom du pack</label>
                    <input id="pack-nom" className={ui.input} name="nom" type="text"
                        placeholder="Ex. Pack Soirée 100 personnes" value={form.nom} onChange={handleChange} required />
                </div>

                <div className={ui.row}>
                    <div className={ui.field}>
                        <label className={ui.label} htmlFor="pack-prix">Prix (€)</label>
                        <input id="pack-prix" className={ui.input} name="prix" type="number" inputMode="decimal"
                            placeholder="0,00" value={form.prix} onChange={handleChange} required min={0.01} step={0.01} />
                    </div>
                    <div className={ui.field}>
                        <label className={ui.label} htmlFor="pack-stock">Stock</label>
                        <input id="pack-stock" className={ui.input} name="stock" type="number" inputMode="numeric"
                            placeholder="0" value={form.stock} onChange={handleChange} required min={0} step={1} />
                    </div>
                </div>

                <div className={ui.field}>
                    <label className={ui.label} htmlFor="pack-souscat">Sous-catégorie</label>
                    <select id="pack-souscat" className={ui.select} name="sous_categorie_id"
                        value={form.sous_categorie_id} onChange={handleChange} required>
                        <option value="">Choisir une sous-catégorie…</option>
                        {sousCategories.map(sc => (
                            <option key={sc.id} value={sc.id}>{sc.nom}</option>
                        ))}
                    </select>
                </div>

                <div className={ui.field}>
                    <label className={ui.label} htmlFor="pack-video">
                        Vidéos YouTube <span className={ui.optional}>(facultatif)</span>
                    </label>
                    <VideoListInput videos={videos} onChange={setVideos} idPrefix="pack-video" />
                </div>

                {/* ---------- Composition du pack ---------- */}
                <fieldset className={styles.compose}>
                    <legend className={styles.composeTitle}>
                        <PackagePlus size={18} aria-hidden="true" /> Contenu du pack
                        <span className={ui.count}>{form.produits.length}</span>
                    </legend>

                    <div className={styles.picker}>
                        <select
                            className={ui.select}
                            aria-label="Produit à ajouter"
                            value={selectedProdId}
                            onChange={e => {
                                setSelectedProdId(e.target.value ? Number(e.target.value) : '');
                                setSelectedProdQty(1);
                            }}
                        >
                            <option value="">Choisir un produit…</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nom} — {p.modele} (stock : {p.stock ?? '—'})
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            className={`${ui.input} ${styles.qty}`}
                            aria-label="Quantité"
                            min={1}
                            max={maxQty}
                            value={selectedProdQty}
                            onChange={e => setSelectedProdQty(Math.min(Math.max(1, Number(e.target.value) || 1), maxQty))}
                            disabled={!selectedProdId}
                        />
                        <button
                            type="button"
                            className={`${ui.btn} ${ui.btnSecondary}`}
                            onClick={addProduct}
                            disabled={!selectedProdId}
                        >
                            <Plus size={17} aria-hidden="true" /> Ajouter
                        </button>
                    </div>
                    {selectedProdId !== '' && <p className={ui.hint}>Quantité maximum : {maxQty}</p>}

                    {form.produits.length === 0 ? (
                        <p className={ui.empty}>Aucun produit pour l’instant.</p>
                    ) : (
                        <ul className={ui.list}>
                            {form.produits.map(({ produit_id, quantite }) => {
                                const prod = findProduct(produit_id);
                                return (
                                    <li key={produit_id} className={ui.listItem}>
                                        <span className={ui.listMain}>
                                            {prod ? prod.nom : 'Produit inconnu'}
                                            {prod && <span className={ui.listMeta}> — {prod.modele}</span>}
                                        </span>
                                        <input
                                            type="number"
                                            className={`${ui.input} ${styles.qtySmall}`}
                                            aria-label={`Quantité de ${prod?.nom || 'ce produit'}`}
                                            min={1}
                                            max={stockOf(produit_id)}
                                            value={quantite}
                                            onChange={e => updateQty(produit_id, e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className={`${ui.iconBtn} ${ui.iconBtnDanger}`}
                                            onClick={() => removeProduct(produit_id)}
                                            aria-label={`Retirer ${prod?.nom || 'ce produit'}`}
                                            title="Retirer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </fieldset>

                <div className={ui.field}>
                    <label className={ui.label} htmlFor="pack-description">Description</label>
                    <textarea id="pack-description" className={ui.textarea} name="description"
                        value={form.description} onChange={handleChange} />
                    <p className={ui.hint}>Générée à partir du contenu du pack, modifiable si besoin.</p>
                </div>

                <div className={ui.formActions}>
                    <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={onClose}>
                        Annuler
                    </button>
                    <SubmitButton loading={loading} icon={isEdit ? Save : Plus}>
                        {isEdit ? 'Enregistrer' : 'Créer le pack'}
                    </SubmitButton>
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
    onSuccess: PropTypes.func.isRequired,
};
