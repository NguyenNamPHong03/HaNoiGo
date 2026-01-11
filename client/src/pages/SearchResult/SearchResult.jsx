import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import AISearchSection from "../../components/common/AISearchSection/AISearchSection";
import DetailPanel from "../../components/common/DetailPanel/DetailPanel";
import FilterSidebar from "../../components/common/FilterSidebar/FilterSidebar";
import PropertyCard from "../../components/common/PropertyCard/PropertyCard";
import usePlaceDetail from "../../hooks/usePlaceDetail.js";
import { usePlaces } from "../../hooks/usePlaces";
import useAIChat from "../../hooks/useAIChat";
import styles from "./SearchResult.module.css";

const SearchResult = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || "";

    const [selectedId, setSelectedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState(initialQuery);

    // AI Chat Hook
    const aiChat = useAIChat();

    // Auto-trigger AI search if query exists in URL
    useEffect(() => {
        if (initialQuery && !aiChat.data && !aiChat.isPending) {
            aiChat.mutate({ question: initialQuery });
        }
    }, [initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch place detail if ID exists in URL
    const { data: placeDetail, isLoading: isLoadingPlace } = usePlaceDetail(id, {
        enabled: !!id
    });

    // Filter States
    const [filters, setFilters] = useState({
        district: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        status: 'Published',
        isActive: true,
        locations: [],
        priceRanges: [],
        types: []
    });

    // Fetch all places with filters
    const { data: placesData, isLoading: isLoadingPlaces, isError, error } = usePlaces({
        ...filters,
        status: 'Published',
        isActive: true
    });

    // Handle AI Search
    const handleAISearch = useCallback((query) => {
        if (query.trim()) {
            aiChat.mutate({ question: query });
        }
    }, [aiChat]);

    const handleFilterChange = useCallback((category, value) => {
        setFilters(prev => {
            if (['locations', 'priceRanges', 'types'].includes(category)) {
                const currentArray = prev[category] || [];
                const newArray = currentArray.includes(value)
                    ? currentArray.filter(item => item !== value)
                    : [...currentArray, value];
                return { ...prev, [category]: newArray };
            }
            return { ...prev, [category]: value };
        });
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
            isActive: true,
            locations: [],
            priceRanges: [],
            types: []
        });
    }, []);

    // Determine which places to show:
    // - If AI has responded, use AI-suggested places
    // - Otherwise, use standard filtered places
    const aiPlaces = aiChat.data?.data?.places || [];
    const standardPlaces = placesData?.places || [];
    const places = aiPlaces.length > 0 ? aiPlaces : standardPlaces;

    // Transform places to PropertyCard format
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
            _originalPlace: place
        }));
    }, [places]);

    // Determine what to show in DetailPanel
    const displayItem = id && placeDetail
        ? {
            ...placeDetail,
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
            _originalPlace: placeDetail
        }
        : (transformedPlaces.find(item => item.id === selectedId) || transformedPlaces[0] || null);

    const isLoadingResults = isLoadingPlaces || aiChat.isPending;

    return (
        <div className={styles.pageWrapper}>
            {/* Left Sidebar - Filters */}
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
                {/* AI Search Section */}
                {!id && (
                    <AISearchSection
                        query={searchQuery}
                        onQueryChange={setSearchQuery}
                        onSearch={handleAISearch}
                        aiResponse={aiChat.data?.data}
                        isLoading={aiChat.isPending}
                    />
                )}

                {id ? (
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
                    <>
                        {isLoadingResults ? (
                            <div className={styles.loadingContainer}>
                                <div className={styles.spinner}></div>
                                <p>{aiChat.isPending ? 'AI đang tìm kiếm...' : 'Đang tải danh sách địa điểm...'}</p>
                            </div>
                        ) : isError ? (
                            <div className={styles.errorMessage}>
                                <h3>Lỗi tải dữ liệu</h3>
                                <p>{error?.message || 'Không thể tải danh sách địa điểm'}</p>
                            </div>
                        ) : (
                            <div className={styles.grid}>
                                {transformedPlaces.length > 0 ? (
                                    <>
                                        {aiPlaces.length > 0 && (
                                            <div className={styles.aiResultsBadge}>
                                                <span>🤖 AI gợi ý: {aiPlaces.length} địa điểm phù hợp</span>
                                            </div>
                                        )}
                                        {transformedPlaces.map((item, index) => (
                                            <PropertyCard
                                                key={item.id}
                                                item={item}
                                                isSelected={selectedId === item.id}
                                                onClick={() => setSelectedId(item.id)}
                                                index={aiPlaces.length > 0 ? index + 1 : null}
                                            />
                                        ))}
                                    </>
                                ) : (
                                    <div className={styles.noResults}>
                                        <h3>Không tìm thấy địa điểm</h3>
                                        <p>Hãy thử điều chỉnh bộ lọc hoặc tìm kiếm bằng AI.</p>
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
