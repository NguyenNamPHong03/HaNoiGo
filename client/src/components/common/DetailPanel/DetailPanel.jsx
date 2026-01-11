/* eslint-disable react/prop-types */
import { memo, useState, useEffect, useMemo } from 'react';
import styles from './DetailPanel.module.css';

const DetailTabs = ({ place }) => {
    const [activeTab, setActiveTab] = useState('overview');

    const description = place.description || `Welcome to ${place.name}`;
    const address = place.address;
    const category = place.category;
    const priceRange = place.priceRange || { min: 0, max: 0 };
    const district = place.district || '';
    const menu = place.menu || [];
    const operatingHours = place.operatingHours || {};
    const contact = place.contact || {};
    const aiTags = place.aiTags || {};
    const averageRating = place.averageRating || 0;
    const totalReviews = place.totalReviews || 0;

    // Rating Distribution
    const reviewsDistribution = place.reviewsDistribution || {
        fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0
    };

    // Real Reviews from Google Data
    const reviews = place.additionalInfo?.reviews || place.googleData?.reviews || [];

    // Calculate total for percentages
    const totalRatingsCount = Object.values(reviewsDistribution).reduce((a, b) => a + b, 0) || totalReviews || 1;

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

                    {/* Operating Hours */}
                    {operatingHours && Object.keys(operatingHours).length > 0 && (
                        <div className={styles.hoursSection}>
                            <p className={styles.label}>Giờ mở cửa:</p>
                            <div className={styles.hoursList}>
                                {Object.entries(operatingHours)
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
                                    ))}
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
                    {/* Rating Summary */}
                    <div className={styles.ratingSummary}>
                        <div className={styles.ratingOverview}>
                            <div className={styles.ratingScore}>
                                <span className={styles.ratingNumber}>{averageRating.toFixed(1)}</span>
                                <div className={styles.ratingStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={star <= Math.round(averageRating) ? "#FFB800" : "rgba(255,255,255,0.3)"}>
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    ))}
                                </div>
                                <p className={styles.ratingCount}>({totalReviews} đánh giá)</p>
                            </div>

                            {/* Rating Distribution Bars */}
                            <div className={styles.ratingDistribution}>
                                {['fiveStar', 'fourStar', 'threeStar', 'twoStar', 'oneStar'].map((key, index) => {
                                    const stars = 5 - index;
                                    const count = reviewsDistribution[key] || 0;
                                    const percent = (count / totalRatingsCount) * 100;

                                    return (
                                        <div key={key} className={styles.distBarRow}>
                                            <span className={styles.starLabel}>{stars}★</span>
                                            <div className={styles.barContainer}>
                                                <div
                                                    className={styles.barFill}
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                            <span className={styles.distCount}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className={styles.reviewsList}>
                        <p className={styles.label}>Đánh giá từ Google ({reviews.length}):</p>

                        {reviews.length > 0 ? (
                            reviews.map((review, idx) => (
                                <div key={idx} className={styles.reviewItem}>
                                    <div className={styles.reviewHeader}>
                                        <div className={styles.reviewerInfo}>
                                            <div className={styles.reviewerAvatar}>
                                                {review.profile_photo_url ? (
                                                    <img src={review.profile_photo_url} alt="User" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                                ) : (
                                                    review.author_name?.charAt(0) || 'U'
                                                )}
                                            </div>
                                            <div>
                                                <strong className={styles.reviewerName}>{review.author_name || 'Người dùng Google'}</strong>
                                                <div className={styles.reviewRating}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <svg key={star} width="12" height="12" viewBox="0 0 24 24" fill={star <= (review.rating || 5) ? "#FFB800" : "#E0E0E0"}>
                                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={styles.reviewDate}>{review.relative_time_description || 'Gần đây'}</span>
                                    </div>
                                    <p className={styles.reviewText}>
                                        {review.text}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className={styles.noData}>Chưa có đánh giá chi tiết.</p>
                        )}
                    </div>
                </div>
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

    useEffect(() => {
        setActiveImage(0);
    }, [place?._id]);

    if (!place) return null;

    const name = place.name || selectedItem.title;
    const address = place.address || selectedItem.address;
    const priceRange = place.priceRange || { min: selectedItem.price, max: selectedItem.price };
    const images = place.images && place.images.length > 0 ? place.images : [selectedItem.image];

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
                        <h2>{name}</h2>
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
                </div>
            </div>
        </aside>
    );
});

DetailPanel.displayName = 'DetailPanel';

export default DetailPanel;
