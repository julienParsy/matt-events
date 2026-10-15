// src/components/admin/AdminHeader.jsx
// En-tête commun des pages admin : titre + navigation, avec zone libre en dessous
// (filtres, recherche…) et boutons d'action à droite.
import AdminNav from './AdminNav';
import ui from '../../styles/components/AdminUI.module.css';

export default function AdminHeader({ icon: Icon, title, subtitle, actions, children }) {
    return (
        <header className={ui.header}>
            <div className={ui.headerTop}>
                {Icon && (
                    <div className={ui.headerIcon} aria-hidden="true">
                        <Icon size={26} />
                    </div>
                )}
                <div className={ui.headerText}>
                    <p className={ui.eyebrow}>Administration</p>
                    <h1 className={ui.headerTitle}>{title}</h1>
                    {subtitle && <p className={ui.headerSubtitle}>{subtitle}</p>}
                </div>
                {actions && <div className={ui.headerActions}>{actions}</div>}
            </div>

            <AdminNav />

            {children && <div className={ui.headerExtra}>{children}</div>}
        </header>
    );
}
