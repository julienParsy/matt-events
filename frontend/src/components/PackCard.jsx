// src/components/PackCard.jsx
import CardBase from './CardBase';
import ProductOverlay from './Overlay'; 
import PackModal from './Modal/PackModal';

export default function PackCard({ pack, onAddPack, ...props }) {
    console.log('PackCard props:', props);
    return (
        <CardBase
            item={pack}
            isPack={true}
            OverlayComponent={ProductOverlay}
            ModalComponent={PackModal}
            onAdd={onAddPack}
            {...props}
        />
    );
}
