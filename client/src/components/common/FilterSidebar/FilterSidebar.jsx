import { useState, memo } from 'react';
import styles from './FilterSidebar.module.css';

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

const FilterSidebar = memo(({ filters, onFilterChange, onPriceRangeChange, onClearAll }) => {
    const handleCheckboxChange = (category, value) => {
        onFilterChange(category, value);
    };

    return (
        <aside className={styles.sidebar} onWheel={(e) => e.stopPropagation()}>
            <div className={styles.sidebarHeader}>
                <h2>Custom Filter</h2>
                <button className={styles.resetBtn} onClick={onClearAll}>Clear all</button>
            </div>

            <div className={styles.filtersContainer}>
                <FilterSection title="Location">
                    <div className={styles.inputGroup}>
                        <span className={styles.searchIcon}>
                            <svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 0 50 50" fill="none">
                                <path d="M26.1667 43.375C25.8267 43.6192 25.4186 43.7505 25 43.7505C24.5814 43.7505 24.1734 43.6192 23.8334 43.375C13.7729 36.2042 3.09586 21.4542 13.8896 10.7958C16.8528 7.88094 20.8434 6.24818 25 6.25C29.1667 6.25 33.1646 7.88542 36.1104 10.7938C46.9042 21.4521 36.2271 36.2 26.1667 43.375Z" stroke="black" strokeWidth="3.125" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M25.0002 25.0001C26.1052 25.0001 27.165 24.5611 27.9464 23.7797C28.7278 22.9983 29.1668 21.9385 29.1668 20.8334C29.1668 19.7283 28.7278 18.6685 27.9464 17.8871C27.165 17.1057 26.1052 16.6667 25.0002 16.6667C23.8951 16.6667 22.8353 17.1057 22.0539 17.8871C21.2725 18.6685 20.8335 19.7283 20.8335 20.8334C20.8335 21.9385 21.2725 22.9983 22.0539 23.7797C22.8353 24.5611 23.8951 25.0001 25.0002 25.0001Z" stroke="black" strokeWidth="3.125" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
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
                            onChange={onPriceRangeChange}
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
    );
});

FilterSidebar.displayName = 'FilterSidebar';

export default FilterSidebar;
