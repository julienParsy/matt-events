// @feature catalogue — Carte d'un produit
// (Édition côté admin : la page AdminCatalogPage ouvre ProductModal via onEdit, la carte ne l'importe pas
// pour ne pas alourdir la boutique avec le code de l'admin.)
import CardBase from './CardBase';
import ProductOverlay from './ProductOverlay';

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
