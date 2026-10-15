// src/components/cart/icons.jsx
// Petites icônes SVG (héritent de la couleur du texte via currentColor).
import React from 'react';

const base = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.25,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: false,
};

export const MinusIcon = () => (
    <svg {...base}>
        <path d="M5 12h14" />
    </svg>
);

export const PlusIcon = () => (
    <svg {...base}>
        <path d="M12 5v14M5 12h14" />
    </svg>
);

export const TrashIcon = () => (
    <svg {...base} strokeWidth={2}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
    </svg>
);