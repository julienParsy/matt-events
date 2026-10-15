// src/components/ui/Modal.jsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import modalStyles from '../../styles/components/Modal.module.css';

const SIZES = { sm: modalStyles.sizeSm, md: modalStyles.sizeMd, lg: modalStyles.sizeLg };

const Modal = ({ isOpen, title, subtitle, children, onClose, size = 'md' }) => {
    const modalRoot = document.getElementById('modal-root') || document.body;

    // Échap pour fermer + page bloquée derrière la fenêtre
    useEffect(() => {
        if (!isOpen) return undefined;
        const handleKey = e => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className={modalStyles.modalOverlay} onMouseDown={onClose}>
            <div
                className={`${modalStyles.modalContent} ${SIZES[size] || ''}`}
                role="dialog"
                aria-modal="true"
                aria-label={title || undefined}
                onMouseDown={e => e.stopPropagation()}
            >
                {title && (
                    <div className={modalStyles.modalHeader}>
                        <div>
                            <h2 className={modalStyles.modalTitle}>{title}</h2>
                            {subtitle && <p className={modalStyles.modalSubtitle}>{subtitle}</p>}
                        </div>
                        <button
                            type="button"
                            className={modalStyles.modalHeaderClose}
                            onClick={onClose}
                            aria-label="Fermer la fenêtre"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
                <div className={modalStyles.modalBody}>{children}</div>
            </div>
        </div>,
        modalRoot
    );
};

Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    children: PropTypes.node,
    onClose: PropTypes.func.isRequired,
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default Modal;
