import { memo, useMemo } from 'react';
import styles from './AISearchSection.module.css';
import Fong from '../Fong/Fong';

import ItineraryTimeline from './ItineraryTimeline';

// Helper to attempt parsing itinerary data
const tryParseItinerary = (text) => {
    try {
        if (!text || typeof text !== 'string') return null;

        // Basic check for JSON object symbols
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');

        if (firstOpen === -1 || lastClose === -1 || lastClose <= firstOpen) return null;

        let jsonString = text.substring(firstOpen, lastClose + 1);

        // Fix trailing commas which are common in LLM JSON
        // Regex looks for comma followed by optional whitespace and then closing brace/bracket
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');

        const data = JSON.parse(jsonString);

        // Validate it has "schedule" array which is unique to our itinerary
        if (data && Array.isArray(data.schedule)) return data;
        return null;
    } catch (e) {
        // console.debug('JSON Parse failed', e);
        return null;
    }
};

/**
 * AISearchSection - Search input with AI-generated summary
 * @param {Object} props
 * @param {string} props.query - Current search query
 * @param {Function} props.onQueryChange - Callback when query changes
 * @param {Function} props.onSearch - Callback when search is triggered
 * @param {Object} props.aiResponse - AI response data
 * @param {boolean} props.isLoading - Loading state
 */
const AISearchSection = memo(({
    query = "",
    onQueryChange,
    onSearch,
    aiResponse = null,
    isLoading = false
}) => {
    const handleClear = () => {
        onQueryChange?.("");
    };

    const handleSearch = () => {
        if (onSearch && query.trim()) {
            onSearch(query);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Robustly determine if we have timeline data to show
    const timelineData = useMemo(() => {
        if (!aiResponse) return null;

        // 1. Check structured data from server
        if (aiResponse.structuredData) {
            return aiResponse.structuredData;
        }

        // 2. Fallback: Parse answer text
        if (aiResponse.answer) {
            return tryParseItinerary(aiResponse.answer);
        }

        return null;
    }, [aiResponse]);

    return (
        <div className={styles.searchSection}>
            <div className={styles.searchInputWrapper}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Tìm quán ốc ngon ở Ba Đình, cafe học bài yên tĩnh..."
                    value={query}
                    onChange={(e) => onQueryChange?.(e.target.value)}
                    onKeyDown={handleKeyDown}
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
                    <button
                        className={`${styles.searchActionBtn} ${styles.locationBtn}`}
                        onClick={() => {
                            if (!navigator.geolocation) {
                                alert("Trình duyệt không hỗ trợ định vị.");
                                return;
                            }

                            navigator.geolocation.getCurrentPosition(
                                (position) => {
                                    const { latitude, longitude } = position.coords;
                                    
                                    // Giữ query hiện tại, fallback "quán ăn" nếu rỗng
                                    const searchQuery = (query || "").trim();
                                    const finalQuery = searchQuery.length ? searchQuery : "quán ăn";
                                    
                                    // Pass nearMe flag để backend biết cần sort by distance
                                    onSearch(finalQuery, { 
                                        latitude, 
                                        longitude,
                                        nearMe: true 
                                    });
                                },
                                (error) => {
                                    console.error("Geolocation error:", error);
                                    alert("Không thể lấy vị trí. Vui lòng cấp quyền truy cập vị trí.");
                                }
                            );
                        }}
                        title="Tìm quanh đây"
                        disabled={isLoading}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </button>
                    <button
                        className={styles.searchActionBtn}
                        onClick={handleSearch}
                        title="Search with AI"
                        disabled={isLoading || !query.trim()}
                    >
                        {isLoading ? (
                            <div className={styles.spinner}></div>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <div className={styles.aiSummary}>
                <div className={styles.aiSummaryHeader}>
                    <Fong />
                    <span>Fong 1.6 AI-generated overview</span>
                </div>
                <div className={styles.aiSummaryContent}>
                    {isLoading ? (
                        <div className={styles.skeletonContainer}>
                            <div className={styles.skeleton}></div>
                            <div className={styles.skeleton}></div>
                            <div className={styles.skeletonShort}></div>
                        </div>
                    ) : aiResponse ? (
                        timelineData ? (
                            <ItineraryTimeline data={timelineData} />
                        ) : (
                            <div
                                className={styles.aiAnswer}
                                dangerouslySetInnerHTML={{
                                    __html: (aiResponse.answer || '')
                                        .replace(/\n/g, '<br/>')
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                }}
                            />
                        )
                    ) : (
                        <>
                            <p>
                                <strong>Khám phá Hà Nội</strong> - Nhập câu hỏi để AI gợi ý địa điểm phù hợp với bạn.
                            </p>
                            <p>
                                Ví dụ: "Quán cafe yên tĩnh để học bài ở Cầu Giấy" hoặc "Nhà hàng lãng mạn cho buổi hẹn hò".
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

AISearchSection.displayName = 'AISearchSection';

export default AISearchSection;
