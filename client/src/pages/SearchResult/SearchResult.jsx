import { useState, useMemo, useCallback } from "react";
import styles from "./SearchResult.module.css";
import PropertyCard from "../../components/common/PropertyCard/PropertyCard";
import FilterSidebar from "../../components/common/FilterSidebar/FilterSidebar";
import DetailPanel from "../../components/common/DetailPanel/DetailPanel";
import AISearchSection from "../../components/common/AISearchSection/AISearchSection";

const MOCK_DATA = [
    {
        id: 1,
        title: "Nhà Phố Vinhomes",
        address: "Số 15 Nguyễn Trãi, Thanh Xuân, Hà Nội",
        price: 15,
        rating: 4.9,
        reviews: 5,
        type: "Home",
        amenities: ["Garden", "Garage"],
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000&auto=format&fit=crop",
        specs: { rooms: 6, beds: 4, baths: 2, kitchens: 2, area: "120m²", garage: 1 }
    },
    {
        id: 2,
        title: "Căn Hộ Times City",
        address: "458 Minh Khai, Hai Bà Trưng, Hà Nội",
        price: 12,
        rating: 4.7,
        reviews: 5,
        type: "Apartment",
        amenities: ["Gym"],
        image: "https://images.unsplash.com/photo-1693282815001-0471e68d3bc0?q=80&w=2342&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        specs: { rooms: 4, beds: 2, baths: 1, kitchens: 1, area: "85m²", garage: 0 }
    },
    {
        id: 3,
        title: "Biệt Thự Tây Hồ",
        address: "Đường Lạc Long Quân, Tây Hồ, Hà Nội",
        price: 35,
        rating: 4.8,
        reviews: 5,
        type: "Villa",
        amenities: ["Garden", "Garage", "Gym"],
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop",
        specs: { rooms: 8, beds: 6, baths: 3, kitchens: 2, area: "250m²", garage: 2 }
    },
    {
        id: 4,
        title: "Nhà Phố Long Biên",
        address: "Ngõ 22 Ngọc Lâm, Long Biên, Hà Nội",
        price: 18,
        rating: 4.7,
        reviews: 5,
        type: "Home",
        amenities: ["Garage"],
        image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=1000&auto=format&fit=crop",
        specs: { rooms: 5, beds: 3, baths: 2, kitchens: 1, area: "100m²", garage: 1 }
    }
];

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

    const handleFilterChange = useCallback((category, value) => {
        setFilters(prev => {
            const current = prev[category];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [category]: updated };
        });
    }, []);

    const handlePriceRangeChange = useCallback(({ min, max }) => {
        setFilters(prev => ({
            ...prev,
            customPriceRange: { min, max }
        }));
    }, []);

    const handleClearAll = useCallback(() => {
        setFilters({
            locations: [],
            priceRanges: [],
            types: [],
            amenities: [],
            customPriceRange: { min: 0, max: 1000 }
        });
    }, []);

    // Filter Logic
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

                if (filters.priceRanges.includes("Custom")) {
                    if (item.price >= filters.customPriceRange.min && item.price <= filters.customPriceRange.max) {
                        matchesPrice = true;
                    }
                }

                if (!matchesPrice && filters.priceRanges.includes("Custom") && filters.priceRanges.length === 1) return false;
                if (!matchesPrice) return false;
            }

            // Type Filter
            if (filters.types.length > 0) {
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

    const selectedItem = filteredData.find(item => item.id === selectedId) || filteredData[0] || null;

    return (
        <div className={styles.pageWrapper}>
            {/* Left Sidebar - Filters */}
            <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onPriceRangeChange={handlePriceRangeChange}
                onClearAll={handleClearAll}
            />

            {/* Middle - Grid */}
            <main className={styles.mainContent}>
                {/* Search Input & AI Summary */}
                <AISearchSection defaultQuery="Apartments for rent in Hanoi" />

                <div className={styles.grid}>
                    {filteredData.length > 0 ? filteredData.map(item => (
                        <PropertyCard
                            key={item.id}
                            item={item}
                            isSelected={selectedId === item.id}
                            onClick={() => setSelectedId(item.id)}
                        />
                    )) : (
                        <div className={styles.noResults}>
                            <h3>No properties found</h3>
                            <p>Try adjusting your filters.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Right - Details Panel */}
            <DetailPanel selectedItem={selectedItem} />
        </div>
    );
};

export default SearchResult;
