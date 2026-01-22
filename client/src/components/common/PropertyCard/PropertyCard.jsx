import { memo, useMemo } from 'react';
import styles from './PropertyCard.module.css';

const PropertyCard = memo(({ item, isSelected, onClick, index = null }) => {
    // Get current opening hours (today)
    const currentHours = useMemo(() => {
        const place = item._originalPlace || item;
        if (!place) return null;

        const openingHours = place.openingHours || [];
        const operatingHours = place.operatingHours || {};

        // Ưu tiên openingHours (từ Google)
        if (openingHours.length > 0) {
            const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
            const daysMap = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
            const todayName = daysMap[today];
            
            const todayHours = openingHours.find(h => h.day === todayName);
            if (todayHours && todayHours.hours) {
                return todayHours.hours.replace(' to ', ' - ');
            }
        }

        // Fallback: operatingHours (legacy format)
        if (Object.keys(operatingHours).length > 0) {
            const today = new Date().getDay();
            const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const todayKey = daysMap[today];
            const hours = operatingHours[todayKey];
            
            if (hours?.open && hours?.close) {
                return `${hours.open} - ${hours.close}`;
            }
        }

        return null;
    }, [item]);

    return (
        <div
            className={`${styles.card} ${isSelected ? styles.selectedCard : ''}`}
            onClick={onClick}
        >
            {index && (
                <div className={styles.indexBadge}>
                    {index}
                </div>
            )}
            <img src={item.image} alt={item.title} className={styles.cardImage} />
            <span className={styles.typeBadge} data-type={item.type}>{item.type}</span>
            <div className={styles.cardContent + " liquid"}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <button className={styles.bookmarkBtn} onClick={(e) => e.stopPropagation()}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </button>
                </div>
                <div className={styles.cardAddress}>
                    <span>{item.address}</span>
                </div>
                {/* Display distance if available (when nearMe is used) */}
                {item.distanceKm !== undefined && item.distanceKm !== null && (
                    <div className={styles.cardDistance}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>Cách bạn {item.distanceKm}km</span>
                    </div>
                )}
                {currentHours && (
                    <div className={styles.cardHours}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>Hôm nay: {currentHours}</span>
                    </div>
                )}
                <div className={styles.cardFooter}>
                    <span className={styles.price}>
                        {item.price?.toLocaleString('vi-VN')}₫
                    </span>
                    <span className={styles.rating}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        {item.rating}/5
                    </span>
                </div>
            </div>
        </div>
    );
});

PropertyCard.displayName = 'PropertyCard';

export default PropertyCard;
