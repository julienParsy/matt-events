// src/components/PackCard.jsx
// (Édition côté admin : la page AdminPanel ouvre PackModal via onEdit.)
import CardBase from './CardBase';
import ProductOverlay from './Overlay';

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
