// src/components/Button.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/components/Button.module.css';  // <- CSS Module import

/**
 * Button component with variants.
 * @param {string} variant - One of: 'default', 'articles', 'less', 'more', 'connexion', 'new', 'modifier', 'ajouter', 'supprimer', 'deconnexion'.
 * @param {boolean} disabled
 * @param {function} onClick
 * @param {React.ReactNode} children
 * @param {object} rest - other button props
 */
export default function Button({ variant = 'default', disabled = false, onClick, children, ...rest }) {
    const variantMap = {
        default: '',
        articles: styles.btnArticles,
        less: styles.btnLessArticles,
        more: styles.btnMoreArticles,
        connexion: styles.btnConnexion,
        new: styles.btnNew,
        modifier: styles.modifier,
        ajouter: styles.btnAjouter,
        supprimer: styles.supprimer,
        deconnexion: styles.deconnexion,
    };

    // toujours appliquer styles.button, puis la variante
    const className = [styles.button, variantMap[variant]]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            className={className}
            disabled={disabled}
            onClick={onClick}
            {...rest}
        >
            {children}
        </button>
    );
}

Button.propTypes = {
    variant: PropTypes.oneOf([
        'default', 'articles', 'less', 'more', 'connexion',
        'new', 'modifier', 'ajouter', 'supprimer', 'deconnexion'
    ]),
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    children: PropTypes.node.isRequired,
};
