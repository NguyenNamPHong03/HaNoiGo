import { useState, useMemo } from "react";
import styles from "./SearchResult.module.css";
import Icon from "../../components/common/Icon/Icon";

const MOCK_DATA = [
    {
        id: 1,
        title: "Dream House Reality",
        address: "Evergreen 14 Jakarta, Indonesia",
        price: 367.00,
        rating: 4.9,
        reviews: 5,
        type: "Home",
        amenities: ["Garden", "Garage"],
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000&auto=format&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600596542815-2a4d9f6fac90?q=80&w=1000&auto=format&fit=crop"
        ],
        specs: { rooms: 6, beds: 4, baths: 2, kitchens: 2, area: "2.820 sqft", garage: 1 }
    },
    {
        id: 2,
        title: "Atap Langit Homes",
        address: "Edelweis City Jakarta, Indonesia",
        price: 278.00,
        rating: 4.7,
        reviews: 5,
        type: "Apartment",
        amenities: ["Gym"],
        image: "https://images.unsplash.com/photo-1600596542815-2a4d9f6fac90?q=80&w=1000&auto=format&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1600596542815-2a4d9f6fac90?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000&auto=format&fit=crop"
        ],
        specs: { rooms: 4, beds: 2, baths: 1, kitchens: 1, area: "1.500 sqft", garage: 0 }
    },
    {
        id: 3,
        title: "Midnight Ridge Villa",
        address: "440 Thamrin Jakarta, Indonesia",
        price: 452.00,
        rating: 4.8,
        reviews: 5,
        type: "Villa",
        amenities: ["Garden", "Garage", "Gym"],
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=1000&auto=format&fit=crop"
        ],
        specs: { rooms: 8, beds: 6, baths: 3, kitchens: 2, area: "3.200 sqft", garage: 2 }
    },
    {
        id: 4,
        title: "Unity Urban Homes",
        address: "Forest City Jakarta, Indonesia",
        price: 278.00,
        rating: 4.7,
        reviews: 5,
        type: "Home",
        amenities: ["Garage"],
        image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=1000&auto=format&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop"
        ],
        specs: { rooms: 5, beds: 3, baths: 2, kitchens: 1, area: "2.100 sqft", garage: 1 }
    }
];

const FilterSection = ({ title, children, defaultExpanded = true }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    return (
        <div className={styles.filterSection}>
            <div className={styles.filterHeader} onClick={() => setIsExpanded(!isExpanded)}>
                <h3>{title}</h3>
                <span className={styles.expandIcon}>{isExpanded ? '−' : '+'}</span>
            </div>
            {isExpanded && <div className={styles.filterContent}>{children}</div>}
        </div>
    );
};

const Checkbox = ({ label, checked, onChange }) => (
    <label className={styles.checkboxWrapper}>
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className={styles.checkboxLabel}>{label}</span>
    </label>
);

const RangeSlider = ({ min, max, onChange }) => {
    const [minVal, setMinVal] = useState(min);
    const [maxVal, setMaxVal] = useState(max);
    const minValRef = useState(min);
    const maxValRef = useState(max);

    // Convert to percentage
    const getPercent = (value) => Math.round(((value - min) / (max - min)) * 100);

    return (
        <div className={styles.rangeSliderWrapper}>
            <div className={styles.rangeValues}>
                <span>${minVal}</span>
                <span>${maxVal}</span>
            </div>
            <div className={styles.sliderContainer}>
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={minVal}
                    onChange={(event) => {
                        const value = Math.min(Number(event.target.value), maxVal - 1);
                        setMinVal(value);
                        minValRef.current = value;
                        onChange({ min: value, max: maxVal });
                    }}
                    className={`${styles.thumb} ${styles.thumbLeft}`}
                    style={{ zIndex: minVal > max - 100 && "5" }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={maxVal}
                    onChange={(event) => {
                        const value = Math.max(Number(event.target.value), minVal + 1);
                        setMaxVal(value);
                        maxValRef.current = value;
                        onChange({ min: minVal, max: value });
                    }}
                    className={`${styles.thumb} ${styles.thumbRight}`}
                />

                <div className={styles.sliderTrack} />
                <div
                    className={styles.sliderRange}
                    style={{
                        left: `${getPercent(minVal)}%`,
                        width: `${getPercent(maxVal) - getPercent(minVal)}%`
                    }}
                />
            </div>
        </div>
    );
};

const SearchResult = () => {
    const [selectedId, setSelectedId] = useState(3);

    // Filter States
    const [filters, setFilters] = useState({
        locations: ["Hai Ba Trung, Long Bien"],
        priceRanges: ["Custom"],
        customPriceRange: { min: 0, max: 1000 },
        types: ["Single Familly Home", "Apartment"],
        amenities: ["Garden"]
    });

    const handleCheckboxChange = (category, value) => {
        setFilters(prev => {
            const current = prev[category];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [category]: updated };
        });
    };

    const handlePriceRangeChange = ({ min, max }) => {
        setFilters(prev => ({
            ...prev,
            customPriceRange: { min, max }
        }));
    };

    const handleClearAll = () => {
        setFilters({
            locations: [],
            priceRanges: [],
            types: [],
            amenities: [],
            customPriceRange: { min: 0, max: 1000 }
        });
    };

    // Filter Logic (Basic implementation for demo)
    const filteredData = useMemo(() => {
        return MOCK_DATA.filter(item => {
            // Location Filter
            if (filters.locations.length > 0) {
                const matchesLocation = filters.locations.some(loc => item.address.includes(loc.split(',')[0]));
                if (!matchesLocation) return false;
            }

            // Price Filter
            if (filters.priceRanges.length > 0) {
                let matchesPrice = false;
                if (filters.priceRanges.includes("Under $1,000") && item.price < 1000) matchesPrice = true;
                if (filters.priceRanges.includes("$1,000 - $15,000") && item.price >= 1000 && item.price <= 15000) matchesPrice = true;
                if (filters.priceRanges.includes("More Than $15,000") && item.price > 15000) matchesPrice = true;

                // Custom Range Logic
                if (filters.priceRanges.includes("Custom")) {
                    if (item.price >= filters.customPriceRange.min && item.price <= filters.customPriceRange.max) {
                        matchesPrice = true;
                    }
                }

                if (!matchesPrice && filters.priceRanges.includes("Custom") && filters.priceRanges.length === 1) return false;
                // If only Custom is selected and it doesn't match, return false. 
                // Creating complex union logic if multiple checked: (A OR B OR Custom)
                if (!matchesPrice) return false;
            }

            // Type Filter
            if (filters.types.length > 0) {
                // Map display labels to data values if necessary, currently simple matching
                const matchesType = filters.types.some(type => {
                    if (type === "Single Familly Home") return item.type === "Home";
                    return item.type === type;
                });
                if (!matchesType) return false;
            }

            // Amenities Filter
            if (filters.amenities.length > 0) {
                const matchesAmenities = filters.amenities.some(amenity => item.amenities?.includes(amenity));
                if (!matchesAmenities) return false;
            }

            return true;
        });
    }, [filters]);

    // Update selected item if the current one is filtered out
    const selectedItem = filteredData.find(item => item.id === selectedId) || filteredData[0] || null;

    return (
        <div className={styles.pageWrapper}>
            {/* Left Sidebar - Filters */}
            <aside
                className={styles.sidebar}
                onWheel={(e) => e.stopPropagation()}
            >
                <div className={styles.sidebarHeader}>
                    <h2>Custom Filter</h2>
                    <button className={styles.resetBtn} onClick={handleClearAll}>Clear all</button>
                </div>

                <div className={styles.filtersContainer}>
                    <FilterSection title="Location">
                        <div className={styles.inputGroup}>
                            <span className={styles.searchIcon}><svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 0 50 50" fill="none">
                                <path d="M26.1667 43.375C25.8267 43.6192 25.4186 43.7505 25 43.7505C24.5814 43.7505 24.1734 43.6192 23.8334 43.375C13.7729 36.2042 3.09586 21.4542 13.8896 10.7958C16.8528 7.88094 20.8434 6.24818 25 6.25C29.1667 6.25 33.1646 7.88542 36.1104 10.7938C46.9042 21.4521 36.2271 36.2 26.1667 43.375Z" stroke="black" strokeWidth="3.125" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M25.0002 25.0001C26.1052 25.0001 27.165 24.5611 27.9464 23.7797C28.7278 22.9983 29.1668 21.9385 29.1668 20.8334C29.1668 19.7283 28.7278 18.6685 27.9464 17.8871C27.165 17.1057 26.1052 16.6667 25.0002 16.6667C23.8951 16.6667 22.8353 17.1057 22.0539 17.8871C21.2725 18.6685 20.8335 19.7283 20.8335 20.8334C20.8335 21.9385 21.2725 22.9983 22.0539 23.7797C22.8353 24.5611 23.8951 25.0001 25.0002 25.0001Z" stroke="black" strokeWidth="3.125" strokeLinecap="round" strokeLinejoin="round" />
                            </svg></span>
                            <input type="text" placeholder="Location" defaultValue="Hai Ba Trung, Long Bien" />

                        </div>
                        <Checkbox
                            label="Hai Ba Trung, Long Bien"
                            checked={filters.locations.includes("Hai Ba Trung, Long Bien")}
                            onChange={() => handleCheckboxChange("locations", "Hai Ba Trung, Long Bien")}
                        />
                        <Checkbox
                            label="Long Bien"
                            checked={filters.locations.includes("Long Bien")}
                            onChange={() => handleCheckboxChange("locations", "Long Bien")}
                        />
                    </FilterSection>

                    <FilterSection title="Price Range">
                        <div className={styles.priceRangeLabels}>
                            <Checkbox
                                label="Under $1,000"
                                checked={filters.priceRanges.includes("Under $1,000")}
                                onChange={() => handleCheckboxChange("priceRanges", "Under $1,000")}
                            />
                            <Checkbox
                                label="$1,000 - $15,000"
                                checked={filters.priceRanges.includes("$1,000 - $15,000")}
                                onChange={() => handleCheckboxChange("priceRanges", "$1,000 - $15,000")}
                            />
                            <Checkbox
                                label="More Than $15,000"
                                checked={filters.priceRanges.includes("More Than $15,000")}
                                onChange={() => handleCheckboxChange("priceRanges", "More Than $15,000")}
                            />
                            <Checkbox
                                label="Custom"
                                checked={filters.priceRanges.includes("Custom")}
                                onChange={() => handleCheckboxChange("priceRanges", "Custom")}
                            />
                        </div>
                        {filters.priceRanges.includes("Custom") && (
                            <RangeSlider
                                min={0}
                                max={1000}
                                onChange={handlePriceRangeChange}
                            />
                        )}
                    </FilterSection>



                    <FilterSection title="Type Of Place">
                        <Checkbox
                            label="Single Familly Home"
                            checked={filters.types.includes("Single Familly Home")}
                            onChange={() => handleCheckboxChange("types", "Single Familly Home")}
                        />
                        <Checkbox
                            label="Condo/Townhouse"
                            checked={filters.types.includes("Condo/Townhouse")}
                            onChange={() => handleCheckboxChange("types", "Condo/Townhouse")}
                        />
                        <Checkbox
                            label="Apartment"
                            checked={filters.types.includes("Apartment")}
                            onChange={() => handleCheckboxChange("types", "Apartment")}
                        />
                        <Checkbox
                            label="Bungalow"
                            checked={filters.types.includes("Bungalow")}
                            onChange={() => handleCheckboxChange("types", "Bungalow")}
                        />
                    </FilterSection>


                </div>
            </aside>

            {/* Middle - Grid */}
            <main className={styles.mainContent}>
                <div className={styles.grid}>
                    {filteredData.length > 0 ? filteredData.map(item => (
                        <div
                            key={item.id}
                            className={`${styles.card} ${selectedId === item.id ? styles.selectedCard : ''}`}
                            onClick={() => setSelectedId(item.id)}
                        >
                            <div className={styles.cardImageWrapper}>
                                <img src={item.image} alt={item.title} className={styles.cardImage} />
                                <span className={styles.typeBadge}>{item.type}</span>
                                <button className={styles.bookmarkBtn}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                </button>
                            </div>
                            <div className={styles.cardContent}>
                                <h3 className={styles.cardTitle}>{item.title}</h3>
                                <div className={styles.cardAddress}>
                                    <span className={styles.pinIcon}>📍</span>
                                    {item.address}
                                </div>
                                <div className={styles.cardFooter}>
                                    <span className={styles.price}>${item.price.toFixed(2)}<span className={styles.period}>/month</span></span>
                                    <span className={styles.rating}>⭐ {item.rating}/{item.reviews}</span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className={styles.noResults}>
                            <h3>No properties found</h3>
                            <p>Try adjusting your filters.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Right - Details Panel */}
            {selectedItem && (
                <aside
                    className={styles.detailPanel}
                    onWheel={(e) => e.stopPropagation()}
                >
                    <div className={styles.detailHeader}>
                        <div className={styles.mainDetailImage}>
                            <img src={selectedItem.image} alt={selectedItem.title} />
                        </div>
                        <div className={styles.smallDetailImages}>
                            {selectedItem.images.slice(1, 3).map((img, idx) => (
                                <img key={idx} src={img} alt="detail" />
                            ))}
                        </div>
                    </div>

                    <div className={styles.detailInfo}>
                        <div className={styles.detailTitleRow}>
                            <h2>{selectedItem.title}</h2>
                            <div className={styles.detailPrice}>${selectedItem.price.toFixed(2)}<span>/month</span></div>
                        </div>
                        <div className={styles.detailAddress}>
                            📍 {selectedItem.address}
                        </div>

                        <div className={styles.tabs}>
                            <span className={styles.activeTab}>Overview</span>
                            <span>Reviews</span>
                            <span>About</span>
                        </div>
                        <div className={styles.tabLine}></div>

                        <div className={styles.description}>
                            <p>
                                <span className={styles.label}>Description :</span> <br />
                                Welcome to {selectedItem.title} 🏡 Experience a peaceful escape at {selectedItem.title},
                                a modern retreat set on a quiet hillside with stunning views of valleys and starry nights.
                            </p>
                        </div>

                        <div className={styles.specsGrid}>
                            <div className={styles.specItem}>🛏 {selectedItem.specs.rooms} Rooms</div>
                            <div className={styles.specItem}>🛌 {selectedItem.specs.beds} Beds</div>
                            <div className={styles.specItem}>🛁 {selectedItem.specs.baths} Baths</div>
                            <div className={styles.specItem}>🍽 {selectedItem.specs.kitchens} Kitchen</div>
                            <div className={styles.specItem}>📐 {selectedItem.specs.area}</div>
                            <div className={styles.specItem}>🚗 {selectedItem.specs.garage} Garage</div>
                        </div>

                        <div className={styles.actionButtons}>
                            <button className={styles.contactBtn}>Contact Agent</button>
                            <button className={styles.orderBtn}>Order Now</button>
                        </div>

                        <div className={styles.mapPreview}>
                            <div className={styles.mapMarker}>
                                <img src={selectedItem.image} className={styles.mapMarkerImg} />
                                <div className={styles.mapMarkerInfo}>
                                    <strong>{selectedItem.title}</strong>
                                    <p>{selectedItem.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            )}
        </div>
    );
};

export default SearchResult;
