// src/components/ProductCard.jsx
// (Édition côté admin : la page AdminPanel ouvre ProductModal via onEdit, la carte ne l'importe pas
// pour ne pas alourdir la boutique avec le code de l'admin.)
import CardBase from './CardBase';
import ProductOverlay from './Overlay';

export default function ProductCard({ produit, ...props }) {
    return (
        <CardBase
            item={produit}
            isPack={false}
            OverlayComponent={ProductOverlay}
            {...props}
        />
    );
}
