import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import AISearchSection from "../../components/common/AISearchSection/AISearchSection";
import DetailPanel from "../../components/common/DetailPanel/DetailPanel";
import FilterSidebar from "../../components/common/FilterSidebar/FilterSidebar";
import PropertyCard from "../../components/common/PropertyCard/PropertyCard";
import usePlaceDetail from "../../hooks/usePlaceDetail.js";
import { usePlaces } from "../../hooks/usePlaces";
import styles from "./SearchResult.module.css";

const SearchResult = () => {
    const { id } = useParams(); // Get place ID from URL
    const [selectedId, setSelectedId] = useState(null);

    // Fetch place detail if ID exists in URL
    const { data: placeDetail, isLoading: isLoadingPlace } = usePlaceDetail(id, {
        enabled: !!id // Only fetch if ID exists
    });

    // Filter States
    const [filters, setFilters] = useState({
        district: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        status: 'Published',
        isActive: true
    });

    // Fetch all places with filters
    const { data: placesData, isLoading: isLoadingPlaces, isError, error } = usePlaces({
        ...filters,
        status: 'Published',
        isActive: true
    });

    const handleFilterChange = useCallback((category, value) => {
        setFilters(prev => ({
            ...prev,
            [category]: value
        }));
    }, []);

    const handlePriceRangeChange = useCallback(({ min, max }) => {
        setFilters(prev => ({
            ...prev,
            minPrice: min || '',
            maxPrice: max || ''
        }));
    }, []);

    const handleClearAll = useCallback(() => {
        setFilters({
            district: '',
            category: '',
            minPrice: '',
            maxPrice: '',
            status: 'Published',
            isActive: true
        });
    }, []);

    // Get places from API
    const places = placesData?.places || [];

    // Transform places to match PropertyCard format
    const transformedPlaces = useMemo(() => {
        return places.map(place => ({
            id: place._id,
            title: place.name,
            address: place.address,
            price: place.priceRange?.max || 0,
            rating: place.averageRating || 0,
            reviews: place.totalReviews || 0,
            type: place.category,
            amenities: [
                ...(place.aiTags?.space || []),
                ...(place.aiTags?.specialFeatures || [])
            ],
            image: place.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000&auto=format&fit=crop',
            specs: {
                area: '120m²',
                rooms: 4,
                beds: 3,
                baths: 2,
                kitchens: 1,
                garage: 1
            },
            // Keep original place data
            _originalPlace: place
        }));
    }, [places]);

    // Determine what to show in DetailPanel
    // If URL has ID → show that place detail
    // Otherwise → show selected item from grid
    const displayItem = id && placeDetail 
        ? {
            ...placeDetail,
            // Transform to match PropertyCard format
            title: placeDetail.name,
            price: placeDetail.priceRange?.max || 0,
            rating: placeDetail.averageRating || 0,
            reviews: placeDetail.totalReviews || 0,
            type: placeDetail.category,
            amenities: [
                ...(placeDetail.aiTags?.space || []),
                ...(placeDetail.aiTags?.specialFeatures || [])
            ],
            image: placeDetail.images?.[0],
            specs: {
                area: '120m²',
                rooms: 4,
                beds: 3,
                baths: 2,
                kitchens: 1,
                garage: 1
            },
            // Keep original place data
            _originalPlace: placeDetail
        }
        : (transformedPlaces.find(item => item.id === selectedId) || transformedPlaces[0] || null);

    return (
        <div className={styles.pageWrapper}>
            {/* Left Sidebar - Filters (hide if showing place detail) */}
            {!id && (
                <FilterSidebar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onPriceRangeChange={handlePriceRangeChange}
                    onClearAll={handleClearAll}
                />
            )}

            {/* Middle - Grid or Loading */}
            <main className={styles.mainContent}>
                {/* Search Input & AI Summary (hide if showing place detail) */}
                {!id && <AISearchSection defaultQuery="Tìm địa điểm ăn uống, vui chơi tại Hà Nội" />}

                {id ? (
                    // Show loading or message when viewing place detail
                    <div className={styles.placeDetailMode}>
                        {isLoadingPlace ? (
                            <div className={styles.loadingContainer}>
                                <div className={styles.spinner}></div>
                                <p>Đang tải thông tin địa điểm...</p>
                            </div>
                        ) : placeDetail ? (
                            <div className={styles.placeDetailInfo}>
                                <h2>{placeDetail.name}</h2>
                                <p className={styles.subtitle}>
                                    Xem chi tiết ở panel bên phải →
                                </p>
                            </div>
                        ) : (
                            <div className={styles.errorMessage}>
                                <h3>Không tìm thấy địa điểm</h3>
                                <p>Địa điểm này không tồn tại hoặc đã bị xóa.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // Show grid when searching
                    <>
                        {isLoadingPlaces ? (
                            <div className={styles.loadingContainer}>
                                <div className={styles.spinner}></div>
                                <p>Đang tải danh sách địa điểm...</p>
                            </div>
                        ) : isError ? (
                            <div className={styles.errorMessage}>
                                <h3>Lỗi tải dữ liệu</h3>
                                <p>{error?.message || 'Không thể tải danh sách địa điểm'}</p>
                            </div>
                        ) : (
                            <div className={styles.grid}>
                                {transformedPlaces.length > 0 ? transformedPlaces.map(item => (
                                    <PropertyCard
                                        key={item.id}
                                        item={item}
                                        isSelected={selectedId === item.id}
                                        onClick={() => setSelectedId(item.id)}
                                    />
                                )) : (
                                    <div className={styles.noResults}>
                                        <h3>Không tìm thấy địa điểm</h3>
                                        <p>Hãy thử điều chỉnh bộ lọc của bạn.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Right - Details Panel */}
            <DetailPanel selectedItem={displayItem} />
        </div>
    );
};

export default SearchResult;
