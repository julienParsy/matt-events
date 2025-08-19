// src/components/Modal/Modal.jsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import modalStyles from '../../styles/components/Modal.module.css';

const Modal = ({ isOpen, title, children, onClose }) => {
    const modalRoot = document.getElementById('modal-root') || document.body;


    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKey);
        }
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className={modalStyles.modalOverlay} onClick={onClose}>
            <div className={modalStyles.modalContent} onClick={e => e.stopPropagation()}>
                {title && (
                    <div className={modalStyles.modalHeader}>
                        <h2 className={modalStyles.modalTitle}>{title}</h2>
                        <button className={modalStyles.modalClose}
                            onClick={onClose}
                            aria-label='Fermer la fenêtre'
                        >
                            ✕
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
    children: PropTypes.node,
    onClose: PropTypes.func.isRequired,
};

Modal.defaultProps = {
    title: null,
    children: null,
};

export default Modal;
