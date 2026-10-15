// src/components/CatalogSections.jsx
// Articles regroupés en sections (titres affichés s'il y a plusieurs sections).
// renderItem(item) fournit la carte : achat côté boutique, édition côté admin.
import styles from '../styles/components/CategoryList.module.css';

export default function CatalogSections({ view, renderItem }) {
    const { visibleSections, showSectionTitles, priceRange, setPriceRange, viewItems, isPackView } = view;

    if (visibleSections.length === 0) {
        return (
            <div className={styles.emptyShop}>
                {priceRange && viewItems.length > 0 ? (
                    <>
                        <p>Aucun article dans la tranche « {priceRange.label} ».</p>
                        <button type="button" className={styles.emptyReset} onClick={() => setPriceRange(null)}>
                            Voir tous les prix
                        </button>
                    </>
                ) : (
                    <p>{isPackView ? 'Aucun pack trouvé.' : 'Aucun article trouvé.'}</p>
                )}
            </div>
        );
    }

    return visibleSections.map(section => (
        <section
            key={section.key}
            className={styles.shopSection}
            aria-labelledby={showSectionTitles ? `section-${section.key}` : undefined}
        >
            {showSectionTitles && (
                <header className={styles.sectionHeader}>
                    <h2 id={`section-${section.key}`} className={styles.sectionTitle}>{section.title}</h2>
                    <span className={styles.sectionCount}>
                        {section.items.length} article{section.items.length > 1 ? 's' : ''}
                    </span>
                </header>
            )}
            <div className={styles.grid4}>
                {section.items.map(renderItem)}
            </div>
        </section>
    ));
}
