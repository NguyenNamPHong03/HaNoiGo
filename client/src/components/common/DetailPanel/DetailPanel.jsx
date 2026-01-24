/* eslint-disable react/prop-types */
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import ImageViewer from '../ImageViewer/ImageViewer';
import ReviewButton from '../../reviews/ReviewButton';
import ReviewList from '../../reviews/ReviewList';
import { usePlaceReviews } from '../../../hooks/useReviews';
import styles from './DetailPanel.module.css';

// Helper: Convert English day names to Vietnamese
const convertDayToVietnamese = (dayName) => {
    const dayMap = {
        'Monday': 'Thứ Hai',
        'Tuesday': 'Thứ Ba',
        'Wednesday': 'Thứ Tư',
        'Thursday': 'Thứ Năm',
        'Friday': 'Thứ Sáu',
        'Saturday': 'Thứ Bảy',
        'Sunday': 'Chủ nhật'
    };
    return dayMap[dayName] || dayName;
};

// Helper: Convert "10 AM to 10 PM" to "10:00 - 22:00"
const convertTimeFormat = (timeStr) => {
    if (!timeStr) return timeStr;

    // Replace "to" with "-"
    let result = timeStr.replace(' to ', ' - ');

    // Convert AM/PM to 24h format
    result = result.replace(/(\d+)(?::(\d+))?\s*(AM|PM)/gi, (match, hour, minute, period) => {
        let h = parseInt(hour);
        const m = minute || '00';

        if (period.toUpperCase() === 'PM' && h !== 12) {
            h += 12;
        } else if (period.toUpperCase() === 'AM' && h === 12) {
            h = 0;
        }

        return `${h.toString().padStart(2, '0')}:${m}`;
    });

    return result;
};

const DetailTabs = ({ place }) => {
    const [activeTab, setActiveTab] = useState('overview');

    // ImageViewer State
    const [lightboxImages, setLightboxImages] = useState([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Open lightbox with specific images and starting index
    const openLightbox = useCallback((images, startIndex = 0) => {
        setLightboxImages(images);
        setLightboxIndex(startIndex);
        setIsLightboxOpen(true);
    }, []);

    const closeLightbox = useCallback(() => {
        setIsLightboxOpen(false);
    }, []);

    // 🔥 Fetch combined reviews data (user + Google reviews)
    const { data: reviewsData } = usePlaceReviews(place._id);

    console.log('🎯 DetailTabs reviewsData:', reviewsData);

    const description = place.description || `Welcome to ${place.name}`;
    const address = place.address;
    const category = place.category;
    const priceRange = place.priceRange || { min: 0, max: 0 };
    const district = place.district || '';
    const menu = place.menu || [];
    const openingHours = place.openingHours || []; // Format mới từ Google
    const operatingHours = place.operatingHours || {}; // Format cũ
    const contact = place.contact || {};
    const aiTags = place.aiTags || {};

    // 🔥 Use combined rating data from reviews API
    // Don't fallback to place data if reviewsData exists (even if rating is 0)
    const combinedAverageRating = reviewsData
        ? (reviewsData.combinedAverageRating ?? 0)
        : (place.averageRating || 0);
    const totalReviews = reviewsData
        ? (reviewsData.total ?? 0)
        : (place.totalReviews || 0);
    const combinedRatingDistribution = reviewsData
        ? (reviewsData.combinedRatingDistribution ?? { fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 })
        : { fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 };

    console.log('📊 DetailTabs Rating Data:', {
        hasReviewsData: !!reviewsData,
        combinedAverageRating,
        totalReviews,
        combinedRatingDistribution
    });

    // Google Data
    const liveStatus = place.googleData?.popularTimesLiveText;
    const isLiveActive = liveStatus && !liveStatus.includes('Less busy');

    return (
        <>
            <div className={styles.tabs}>
                <span
                    className={activeTab === 'overview' ? styles.activeTab : ''}
                    onClick={() => setActiveTab('overview')}
                >
                    Tổng quan
                </span>
                <span
                    className={activeTab === 'menu' ? styles.activeTab : ''}
                    onClick={() => setActiveTab('menu')}
                >
                    Menu
                </span>
                <span
                    className={activeTab === 'reviews' ? styles.activeTab : ''}
                    onClick={() => setActiveTab('reviews')}
                >
                    Đánh giá
                </span>
            </div>
            <div className={styles.tabLine}></div>

            {activeTab === 'overview' && (
                <div className={styles.tabContent}>
                    {/* Meta Info Row */}
                    <div className={styles.metaRow}>
                        {liveStatus && (
                            <div className={styles.liveStatus}>
                                {isLiveActive && <div className={styles.liveIndicator}></div>}
                                {liveStatus}
                            </div>
                        )}
                        {place.viewCount > 0 && (
                            <div className={styles.viewCount}>
                                {place.viewCount.toLocaleString()} lượt xem
                            </div>
                        )}
                        <div className={styles.viewCount}>
                            {place.status || 'Verified'}
                        </div>
                    </div>

                    <p className={styles.label}>Mô tả:</p>
                    <p className={styles.descriptionText}>
                        {description}
                    </p>

                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Địa chỉ:</span>
                            <span className={styles.infoValue}>{address}</span>
                        </div>
                        {district && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Quận:</span>
                                <span className={styles.infoValue}>{district}</span>
                            </div>
                        )}
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Loại hình:</span>
                            <span className={styles.infoValue}>{category}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Giá:</span>
                            <span className={styles.infoValue}>
                                {priceRange.min === priceRange.max
                                    ? `${priceRange.min?.toLocaleString('vi-VN')}₫`
                                    : `${priceRange.min?.toLocaleString('vi-VN')}₫ - ${priceRange.max?.toLocaleString('vi-VN')}₫`
                                }
                            </span>
                        </div>
                    </div>

                    {/* Rich AI Tags Grouped */}
                    {aiTags && (
                        <div className={styles.tagsSection}>
                            {aiTags.space?.length > 0 && (
                                <>
                                    <p className={styles.label}>Không gian:</p>
                                    <div className={styles.tagsList}>
                                        {aiTags.space.map((tag, idx) => (
                                            <span key={idx} className={styles.tag}>{tag}</span>
                                        ))}
                                    </div>
                                </>
                            )}

                            {aiTags.mood?.length > 0 && (
                                <>
                                    <div style={{ marginTop: '15px' }}></div>
                                    <p className={styles.label}>Không khí:</p>
                                    <div className={styles.tagsList}>
                                        {aiTags.mood.map((tag, idx) => (
                                            <span key={idx} className={styles.tag}>{tag}</span>
                                        ))}
                                    </div>
                                </>
                            )}

                            {aiTags.suitability?.length > 0 && (
                                <>
                                    <div style={{ marginTop: '15px' }}></div>
                                    <p className={styles.label}>Phù hợp cho:</p>
                                    <div className={styles.tagsList}>
                                        {aiTags.suitability.map((tag, idx) => (
                                            <span key={idx} className={styles.tag}>{tag}</span>
                                        ))}
                                    </div>
                                </>
                            )}

                            {aiTags.specialFeatures?.length > 0 && (
                                <>
                                    <div style={{ marginTop: '15px' }}></div>
                                    <p className={styles.label}>Tiện ích:</p>
                                    <div className={styles.tagsList}>
                                        {aiTags.specialFeatures.map((tag, idx) => (
                                            <span key={idx} className={styles.tag}>{tag}</span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Operating Hours - Hiển thị openingHours (từ Google) hoặc operatingHours (legacy) */}
                    {(openingHours.length > 0 || Object.keys(operatingHours).length > 0) && (
                        <div className={styles.hoursSection}>
                            <p className={styles.label}>Giờ mở cửa:</p>
                            <div className={styles.hoursList}>
                                {/* Ưu tiên openingHours (format mới từ Google) */}
                                {openingHours.length > 0 ? (
                                    openingHours.map((item, idx) => (
                                        <div key={idx} className={styles.hoursItem}>
                                            <span className={styles.dayName}>
                                                {convertDayToVietnamese(item.day)}
                                            </span>
                                            <span className={styles.hourTime}>
                                                {convertTimeFormat(item.hours)}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    /* Fallback: operatingHours (format cũ) */
                                    Object.entries(operatingHours)
                                        .filter(([, hours]) => hours?.open || hours?.close)
                                        .map(([day, hours]) => (
                                            <div key={day} className={styles.hoursItem}>
                                                <span className={styles.dayName}>
                                                    {day === 'monday' && 'Thứ 2'}
                                                    {day === 'tuesday' && 'Thứ 3'}
                                                    {day === 'wednesday' && 'Thứ 4'}
                                                    {day === 'thursday' && 'Thứ 5'}
                                                    {day === 'friday' && 'Thứ 6'}
                                                    {day === 'saturday' && 'Thứ 7'}
                                                    {day === 'sunday' && 'Chủ nhật'}
                                                </span>
                                                <span className={styles.hourTime}>
                                                    {hours.open && hours.close
                                                        ? `${hours.open} - ${hours.close}`
                                                        : hours.open
                                                            ? `Mở cửa: ${hours.open}`
                                                            : `Đóng cửa: ${hours.close}`
                                                    }
                                                </span>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contact Info */}
                    {(contact?.phone || contact?.website) && (
                        <div className={styles.contactSection}>
                            <p className={styles.label}>Liên hệ:</p>
                            {contact.phone && (
                                <p className={styles.contactItem}>
                                    SĐT: {contact.phone}
                                </p>
                            )}
                            {contact.website && (
                                <p className={styles.contactItem}>
                                    Web: <a href={contact.website} target="_blank" rel="noopener noreferrer">
                                        Website
                                    </a>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'menu' && (
                <div className={styles.tabContent}>
                    {menu && menu.length > 0 ? (
                        <div className={styles.menuSection}>
                            <p className={styles.label}>Thực đơn nổi bật:</p>
                            {menu.map((item, idx) => (
                                <div key={idx} className={styles.menuItem}>
                                    <div className={styles.menuItemHeader}>
                                        <strong>{item.name}</strong>
                                        <span className={styles.menuPrice}>
                                            {item.price?.toLocaleString('vi-VN')}₫
                                        </span>
                                    </div>
                                    {item.description && (
                                        <p className={styles.menuDescription}>{item.description}</p>
                                    )}
                                    {item.category && (
                                        <span className={styles.menuCategory}>{item.category}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={styles.noData}>Chưa có thông tin menu chi tiết</p>
                    )}
                </div>
            )}

            {activeTab === 'reviews' && (
                <div className={styles.tabContent}>
                    {/* Review Button - Viết đánh giá */}
                    <div className={styles.reviewButtonWrapper}>
                        <ReviewButton placeId={place._id} placeName={place.name} />
                    </div>

                    {/* Reviews List - User reviews + Google reviews */}
                    <ReviewList placeId={place._id} />
                </div>
            )}

            {/* Image Lightbox */}
            {isLightboxOpen && (
                <ImageViewer
                    images={lightboxImages}
                    currentIndex={lightboxIndex}
                    onClose={closeLightbox}
                    onNavigate={setLightboxIndex}
                />
            )}
        </>
    );
};

const DetailPanel = memo(({ selectedItem }) => {
    // Reset image when place changes
    const [activeImage, setActiveImage] = useState(0);

    // Get real data from database
    const place = useMemo(() => {
        if (!selectedItem) return null;
        return selectedItem._originalPlace || selectedItem;
    }, [selectedItem]);

    // 🔥 Fetch combined reviews data for header display
    const { data: reviewsData } = usePlaceReviews(place?._id);

    useEffect(() => {
        setActiveImage(0);
    }, [place?._id]);

    // Handler: Open Google Maps with GPS coordinates (MUST be before early return)
    const handleOpenGoogleMaps = useCallback(() => {
        if (!place) return;

        const address = place.address || selectedItem?.address || '';
        const location = place.location;

        if (location && location.coordinates && location.coordinates.length === 2) {
            const [lng, lat] = location.coordinates;
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            // Fallback: search by address
            const encodedAddress = encodeURIComponent(address);
            const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }, [place, selectedItem]);

    if (!place) return null;

    const name = place.name || selectedItem.title;
    const address = place.address || selectedItem.address;
    const priceRange = place.priceRange || { min: selectedItem.price, max: selectedItem.price };
    const images = place.images && place.images.length > 0 ? place.images : [selectedItem.image];

    // 🔥 Combined rating from reviews
    const combinedAverageRating = reviewsData?.combinedAverageRating || place.averageRating || 0;
    const totalReviews = reviewsData?.total || place.totalReviews || 0;

    // Safety check: ensure at least one image exists
    const safeImages = images.filter(Boolean);
    if (safeImages.length === 0) safeImages.push('https://via.placeholder.com/400x300?text=No+Image');

    return (
        <aside className={styles.detailPanel} onWheel={(e) => e.stopPropagation()}>
            <div className={styles.detailImage}>
                <div className={styles.mainImageWrapper}>
                    <img
                        src={safeImages[activeImage]}
                        alt={name}
                    />
                </div>

                {safeImages.length > 1 && (
                    <div className={styles.imageThumbnails}>
                        {safeImages.map((img, idx) => (
                            <div
                                key={idx}
                                className={`${styles.thumbnail} ${activeImage === idx ? styles.active : ''}`}
                                onClick={() => setActiveImage(idx)}
                            >
                                <img src={img} alt={`Thumb ${idx}`} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.detailInfo}>
                <div className={styles.detailTitleRow}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h2 style={{ margin: 0 }}>{name}</h2>
                            {combinedAverageRating > 0 && (
                                <div className={styles.ratingBadge}>
                                    <span className={styles.ratingValue}>{combinedAverageRating.toFixed(1)}</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800" style={{ marginLeft: '2px' }}>
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    <span className={styles.ratingCount}>({totalReviews})</span>
                                </div>
                            )}
                        </div>
                        <div className={styles.detailAddress}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#0066FF" />
                                <circle cx="12" cy="10" r="3" fill="#fff" />
                            </svg>
                            {address}
                        </div>
                    </div>
                </div>

                <DetailTabs place={place} />

                <div className={styles.actionButtons}>
                    <button className={styles.contactBtn}>Liên hệ</button>
                    <button className={styles.orderBtn}>Đặt ngay</button>
                    <button
                        className={styles.directionsBtn}
                        onClick={handleOpenGoogleMaps}
                        title="Mở Google Maps để chỉ đường"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        Chỉ đường
                    </button>
                </div>
            </div>
        </aside>
    );
});

DetailPanel.displayName = 'DetailPanel';

export default DetailPanel;
