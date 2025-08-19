import React, { useEffect, useState } from 'react';
import axiosInstance from '../../services/axiosInstance';
import styles from '../../styles/pages/AdminUsers.module.css';
import stylesBack from '../../styles/components/BackButton.module.css';
import stylesBtn from '../../styles/components/Button.module.css';
import NavAdmin from './NavAdmin';

export default function AdminUsers() {
    const [admins, setAdmins] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ email: '', mdp: '' });

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        const res = await axiosInstance.get('/admins');
        setAdmins(res.data);
    };

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            await axiosInstance.post('/admins', form);
            setModalOpen(false);
            setForm({ email: '', mdp: '' });
            fetchAdmins();
        } catch (err) {
            alert(err.response?.data?.message || "Erreur lors de l'ajout");
        }
    };

    const supprimer = async id => {
        if (window.confirm('Supprimer cet admin ?')) {
            try {
                await axiosInstance.delete(`/admins/${id}`);
                fetchAdmins();
            } catch (err) {
                alert(err.response?.data?.message || "Erreur lors de la suppression");
            }
        }
    };

    return (
        <div>
            <div className='banner'>
            <h1>Gestion des administrateurs</h1>

                <NavAdmin />
            </div>
            <div className={styles.adminUsersContainer}>
                <nav className={stylesBack.breadcrumb}>
                    <span className={stylesBack.breadcrumbItem} onClick={() => window.location.href = '/admin'}>Admin</span>
                    <span className={stylesBack.breadcrumbSep}>/</span>
                    <span className={stylesBack.breadcrumbItemActive}>Gestion des administrateurs</span>
                </nav>
                <div className={stylesBtn.divNouveauProduit}>
                    <button className={`${stylesBtn.button} ${stylesBtn.btnNew}`} onClick={() => setModalOpen(true)}>
                    Ajouter un admin
                    </button>
                </div>
                <table className={styles.adminUsersTable}>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map(a => (
                            <tr key={a.id}>
                                <td>{a.email}</td>
                                <td>
                                    <button
                                        className={`${stylesBtn.button} ${stylesBtn.supprimer}`}
                                        onClick={() => supprimer(a.id)}
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {modalOpen && (
                    <form className={styles.adminForm} onSubmit={handleSubmit}>
                        <input
                            name="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                        <input
                            name="mdp"
                            placeholder="Mot de passe"
                            value={form.mdp}
                            onChange={handleChange}
                            type="password"
                            required
                        />
                        <button className={`${stylesBtn.button} ${stylesBtn.btnNew}`} type="submit">Ajouter</button>
                        <button className={`${stylesBtn.button} ${stylesBtn.supprimer}`} type="button" onClick={() => setModalOpen(false)}>
                            Annuler
                        </button>
                    </form>
                )}


            </div>
        </div>
    );
}