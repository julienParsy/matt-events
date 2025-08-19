// src/components/ProductCard.jsx
import CardBase from './CardBase';
import ProductOverlay from './Overlay';
import ProductModal from './Modal/ProductModal';

export default function ProductCard({ produit, ...props }) {
    return (
        <CardBase
            item={produit}
            isPack={false}
            OverlayComponent={ProductOverlay}
            ModalComponent={ProductModal}
            {...props}
        />
    );
}
