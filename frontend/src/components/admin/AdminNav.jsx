// src/components/admin/AdminNav.jsx
import { NavLink } from 'react-router-dom';
import {
    Package, FolderTree, Inbox, Receipt, Users, Settings, Image,
    Info, ShieldCheck, Scale,
} from 'lucide-react';
import ui from '../../styles/components/AdminUI.module.css';

const ADMIN_LINKS = [
    { to: '/admin', label: 'Produits', icon: Package, end: true },
    { to: '/admin/categories', label: 'Catégories', icon: FolderTree },
    { to: '/admin/demandes', label: 'Demandes', icon: Inbox },
    { to: '/admin/factures', label: 'Factures', icon: Receipt },
    { to: '/admin/utilisateurs', label: 'Administrateurs', icon: Users },
    { to: '/admin/parametres', label: 'Paramètres', icon: Settings },
    { to: '/admin/logo', label: 'Logo', icon: Image },
];

// Pages éditables : ouvertes directement en mode édition
const PAGE_LINKS = [
    { to: '/a-propos', label: 'À propos', icon: Info },
    { to: '/confidentialite', label: 'Confidentialité', icon: ShieldCheck },
    { to: '/mentions-legales', label: 'Mentions légales', icon: Scale },
];

export default function AdminNav() {
    const linkClass = ({ isActive }) => `${ui.navLink} ${isActive ? ui.navLinkActive : ''}`;

    return (
        <nav className={ui.nav} aria-label="Navigation de l'administration">
            <div className={ui.navGroup}>
                <span className={ui.navLabel}>Gestion</span>
                {ADMIN_LINKS.map(link => {
                    const Icon = link.icon;
                    return (
                        <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                            <Icon size={16} aria-hidden="true" /> {link.label}
                        </NavLink>
                    );
                })}
            </div>
            <div className={ui.navGroup}>
                <span className={ui.navLabel}>Pages</span>
                {PAGE_LINKS.map(link => {
                    const Icon = link.icon;
                    return (
                        <NavLink key={link.to} to={link.to} state={{ edit: true }} className={linkClass}>
                            <Icon size={16} aria-hidden="true" /> {link.label}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}
