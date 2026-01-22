import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AISearchSection from "../../components/common/AISearchSection/AISearchSection";
import DetailPanel from "../../components/common/DetailPanel/DetailPanel";
import PropertyCard from "../../components/common/PropertyCard/PropertyCard";
import WeatherSidebar from "../../components/common/WeatherSidebar/WeatherSidebar";
import { useUser } from "../../contexts/UserContext";
import useAIChat from "../../hooks/useAIChat";
import styles from "./SearchResult.module.css";

const SearchResult = () => {
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || "";

    const [selectedId, setSelectedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [isNearMeActive, setIsNearMeActive] = useState(false); // Track if searching by location

    // Get user preferences for personalization
    const { user } = useUser();
    const userPreferences = user?.preferences || null;

    // AI Chat Hook
    const aiChat = useAIChat();

    // Auto-trigger AI search if query exists in URL
    useEffect(() => {
        if (initialQuery && !aiChat.data && !aiChat.isPending) {
            aiChat.mutate({ 
                question: initialQuery,
                context: {
                    userPreferences,
                    usePersonalization: true
                }
            });
        }
    }, [initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // DISABLED: Không fetch all places nữa, chỉ dùng AI results
    // const { data: placesData, isLoading: isLoadingPlaces, isError, error } = usePlaces({
    //     ...filters,
    //     status: 'Published',
    //     isActive: true
    // });

    // Handle AI Search
    const handleAISearch = useCallback((query, context = {}) => {
        if (query.trim()) {
            // Track if this is a nearMe search
            setIsNearMeActive(context.nearMe === true);
            
            aiChat.mutate({ 
                question: query, 
                context: {
                    ...context,
                    userPreferences,
                    usePersonalization: true
                }
            });
        }
    }, [aiChat, userPreferences]);

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
    // - If AI has responded, ONLY show AI-suggested places (not all places)
    // - If NO AI response, show empty or prompt user to search
    const aiPlaces = aiChat.data?.data?.places || [];
    const places = aiPlaces; // Chỉ hiển thị places mà AI gợi ý

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
            distanceKm: place.distanceKm, // Pass distance from backend
            _originalPlace: place
        }));
    }, [places]);

    // Get selected place from list for DetailPanel
    const selectedPlace = useMemo(() => {
        if (!selectedId) return null;
        return transformedPlaces.find(p => p.id === selectedId);
    }, [selectedId, transformedPlaces]);

    const isLoadingResults = aiChat.isPending;

    return (
        <div className={styles.pageWrapper}>
            {/* Left Sidebar - Weather */}
            <WeatherSidebar />

            {/* Middle - Grid or Loading */}
            <main className={styles.mainContent}>
                {/* AI Search Section */}
                <AISearchSection
                    query={searchQuery}
                    onQueryChange={setSearchQuery}
                    onSearch={handleAISearch}
                    aiResponse={aiChat.data?.data}
                    isLoading={aiChat.isPending}
                />

                {isLoadingResults ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>AI đang tìm kiếm...</p>
                    </div>
                ) : aiChat.isError ? (
                    <div className={styles.errorMessage}>
                        <h3>Lỗi tìm kiếm</h3>
                        <p>{aiChat.error?.message || 'Không thể tìm kiếm, vui lòng thử lại'}</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {transformedPlaces.length > 0 ? (
                            <>
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
                                <h3>Chưa có kết quả tìm kiếm</h3>
                                <p>Hãy nhập câu hỏi ở ô tìm kiếm phía trên để AI gợi ý địa điểm phù hợp với bạn.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Right - Details Panel */}
            <DetailPanel selectedItem={selectedPlace} />
        </div>
    );
};

export default SearchResult;
