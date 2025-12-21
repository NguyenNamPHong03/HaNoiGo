import { memo, useState } from 'react';
import styles from './AISearchSection.module.css';
import Fong from '../Fong/Fong'

const AISearchSection = memo(({ defaultQuery = "", onSearch }) => {
    const [query, setQuery] = useState(defaultQuery);

    const handleClear = () => {
        setQuery("");
    };

    const handleSearch = () => {
        if (onSearch) {
            onSearch(query);
        }
    };

    return (
        <div className={styles.searchSection}>
            <div className={styles.searchInputWrapper}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search for places, apartments, villas..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                {query && (
                    <button className={styles.searchClearBtn} onClick={handleClear}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                )}
                <div className={styles.searchActions}>
                    <button className={styles.searchActionBtn} title="Grid view">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="9" y1="21" x2="9" y2="9"></line>
                        </svg>
                    </button>
                    <button className={styles.searchActionBtn} title="Voice search">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                    </button>
                    <button className={styles.searchActionBtn} onClick={handleSearch} title="Search">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                </div>
            </div>

            <div className={styles.aiSummary}>
                <div className={styles.aiSummaryHeader}>
                    <Fong />
                    <span>Fong 1.6 AI-generated overview</span>
                </div>
                <div className={styles.aiSummaryContent}>
                    <p>
                        <strong>Apartments for rent in Hanoi</strong> are one of the most popular choices for tenants,
                        especially young families and working professionals. Districts such as Hai Ba Trung, Long Bien, and Tay Ho
                        offer many quality apartments with full amenities including gym, swimming pool, and 24/7 security.
                    </p>
                    <p>
                        Rental prices range from <strong>10-35 million VND/month</strong> depending on location, area, and amenities.
                        Notable projects include Vinhomes, Times City, and villas in the Tay Ho area.
                    </p>
                </div>
            </div>
        </div>
    );
});

AISearchSection.displayName = 'AISearchSection';

export default AISearchSection;
