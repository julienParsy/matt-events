// src/components/catalog/PackCard.jsx
// (Édition côté admin : la page AdminCatalogPage ouvre PackModal via onEdit.)
import CardBase from './CardBase';
import ProductOverlay from './ProductOverlay';

export default function PackCard({ pack, onAddPack, ...props }) {
    return (
        <CardBase
            item={pack}
            isPack={true}
            OverlayComponent={ProductOverlay}
            onAdd={onAddPack}
            {...props}
        />
    );
}
