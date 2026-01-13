import { useState } from "react";
import { useParams } from "react-router-dom";
import usePlaceDetail from "../../hooks/usePlaceDetail.js";
import styles from "./PlaceDetail.module.css";

const PlaceDetail = () => {
    const { id } = useParams();
    const { data: place, isLoading, isError } = usePlaceDetail(id, {
        enabled: !!id
    });

    const [activeTab, setActiveTab] = useState('overview');

    if (isLoading) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải thông tin địa điểm...</p>
                </div>
            </div>
        );
    }

    if (isError || !place) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.errorContainer}>
                    <h2>Không tìm thấy địa điểm</h2>
                    <p>Địa điểm này không tồn tại hoặc đã bị xóa.</p>
                </div>
            </div>
        );
    }

    // Extract data
    const images = place.images || [];
    const name = place.name || '';
    const address = place.address || '';
    const district = place.district || '';
    const category = place.category || '';
    const priceRange = place.priceRange || { min: 0, max: 0 };
    const description = place.description || '';
    const averageRating = place.averageRating || 0;
    const totalReviews = place.totalReviews || 0;
    const aiTags = place.aiTags || {};
    const operatingHours = place.operatingHours || {};
    const contact = place.contact || {};
    const menu = place.menu || [];
    const reviews = place.additionalInfo?.reviews || place.googleData?.reviews || [];
    const location = place.location || place.coordinates || null;

    // Handler: Mở Google Maps để chỉ đường
    const handleGetDirections = () => {
        if (location && location.lat && location.lng) {
            // Mở Google Maps với tọa độ
            const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
            window.open(url, '_blank');
        } else if (address) {
            // Fallback: dùng địa chỉ text nếu không có tọa độ
            const encodedAddress = encodeURIComponent(`${address}, ${district}, Hà Nội`);
            const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
            window.open(url, '_blank');
        } else {
            alert('Không tìm thấy thông tin vị trí của quán');
        }
    };

    // Mapping tên ngày sang tiếng Việt
    const dayNames = {
        'monday': 'Thứ 2',
        'tuesday': 'Thứ 3',
        'wednesday': 'Thứ 4',
        'thursday': 'Thứ 5',
        'friday': 'Thứ 6',
        'saturday': 'Thứ 7',
        'sunday': 'Chủ nhật'
    };

    return (
        <div className={styles.pageWrapper}>
            {/* LEFT SIDEBAR - Promotions & Deals */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarContent}>
                    <h2 className={styles.sidebarTitle}>Ưu đãi & Món mới</h2>
                    
                    {/* Placeholder cho promotions - sẽ fetch từ API sau */}
                    <div className={styles.promotionCard}>
                        <div className={styles.promotionBadge}>🎉 Ưu đãi đặc biệt</div>
                        <h3 className={styles.promotionTitle}>Giảm 20% cho khách hàng mới</h3>
                        <p className={styles.promotionDescription}>
                            Áp dụng cho hóa đơn từ 200.000₫. Sử dụng mã: WELCOME20
                        </p>
                        <p className={styles.promotionExpiry}>Hết hạn: 31/01/2026</p>
                    </div>

                    <div className={styles.promotionCard}>
                        <div className={styles.promotionBadge}>🍹 Món mới</div>
                        <h3 className={styles.promotionTitle}>Cocktail mùa đông</h3>
                        <p className={styles.promotionDescription}>
                            Thử ngay bộ sưu tập cocktail mới với hương vị độc đáo
                        </p>
                    </div>

                    <div className={styles.promotionCard}>
                        <div className={styles.promotionBadge}>⏰ Happy Hour</div>
                        <h3 className={styles.promotionTitle}>Giảm 30% từ 14h-17h</h3>
                        <p className={styles.promotionDescription}>
                            Áp dụng cho tất cả đồ uống và món khai vị
                        </p>
                        <p className={styles.promotionExpiry}>Thứ 2 - Thứ 6</p>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.actionButtons}>
                        <button className={styles.btnPrimary}>
                            📞 Liên hệ đặt bàn
                        </button>
                        <button className={styles.btnSecondary}>
                            ❤️ Lưu vào yêu thích
                        </button>
                    </div>
                </div>
            </aside>

            {/* RIGHT MAIN CONTENT - Thông tin chi tiết quán */}
            <main className={styles.mainContent}>
                {/* Hero Image */}
                {images.length > 0 && (
                    <div className={styles.heroImage}>
                        <img src={images[0]} alt={name} />
                    </div>
                )}

                {/* Header Section with Name and Address */}
                <div className={styles.headerSection}>
                    <h1 className={styles.placeName}>{name}</h1>
                    <p className={styles.placeAddress}>
                        📍 {address}, {district}
                    </p>
                </div>

                {/* Tabs Navigation */}
                <div className={styles.tabsContainer}>
                    <div className={styles.tabs}>
                        <button 
                            className={activeTab === 'overview' ? styles.activeTab : styles.tab}
                            onClick={() => setActiveTab('overview')}
                        >
                            Tổng quan
                        </button>
                        <button 
                            className={activeTab === 'menu' ? styles.activeTab : styles.tab}
                            onClick={() => setActiveTab('menu')}
                        >
                            Menu
                        </button>
                        <button 
                            className={activeTab === 'reviews' ? styles.activeTab : styles.tab}
                            onClick={() => setActiveTab('reviews')}
                        >
                            Đánh giá
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className={styles.tabContent}>
                    {activeTab === 'overview' && (
                        <div className={styles.overviewTab}>
                            {/* Status Badge */}
                            <div className={styles.statusBadge}>
                                {place.status || 'Verified'}
                            </div>

                            {/* Description */}
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>Mô tả:</h2>
                                <p className={styles.description}>{description}</p>
                            </section>

                            {/* Info Details Grid */}
                            <section className={styles.section}>
                                <div className={styles.detailsGrid}>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Địa chỉ:</span>
                                        <span className={styles.detailValue}>{address}, {district}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Quận:</span>
                                        <span className={styles.detailValue}>{district}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Loại hình:</span>
                                        <span className={styles.detailValue}>{category}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Giá:</span>
                                        <span className={styles.detailValue}>
                                            {priceRange.min === priceRange.max
                                                ? `${priceRange.min?.toLocaleString('vi-VN')}₫`
                                                : `${priceRange.min?.toLocaleString('vi-VN')}₫ - ${priceRange.max?.toLocaleString('vi-VN')}₫`
                                            }
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* AI Tags */}
                            {aiTags.space?.length > 0 && (
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Không gian:</h2>
                                    <div className={styles.tagsList}>
                                        {aiTags.space.map((tag, idx) => (
                                            <span key={idx} className={styles.tag}>{tag}</span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {aiTags.mood?.length > 0 && (
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Không khí:</h2>
                                    <div className={styles.tagsList}>
                                        {aiTags.mood.map((tag, idx) => (
                                            <span key={idx} className={styles.tag}>{tag}</span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {aiTags.suitability?.length > 0 && (
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Tiện ích:</h2>
                                    <div className={styles.tagsList}>
                                        {aiTags.suitability.map((tag, idx) => (
                                            <span key={idx} className={styles.tag}>{tag}</span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Operating Hours */}
                            {Object.keys(operatingHours).length > 0 && (
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Giờ mở cửa</h2>
                                    <div className={styles.hoursGrid}>
                                        {Object.entries(operatingHours).map(([day, hours]) => (
                                            <div key={day} className={styles.hourRow}>
                                                <span className={styles.dayName}>
                                                    {dayNames[day.toLowerCase()] || day}
                                                </span>
                                                <span className={styles.hourValue}>
                                                    {typeof hours === 'string' 
                                                        ? hours 
                                                        : hours?.open && hours?.close 
                                                            ? `${hours.open} - ${hours.close}`
                                                            : 'Đóng cửa'
                                                    }
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Action Buttons */}
                            <div className={styles.actionButtonsBottom}>
                                <button className={styles.btnOutline}>
                                    Liên hệ
                                </button>
                                <button className={styles.btnPrimaryLarge}>
                                    Đặt ngay
                                </button>
                                <button className={styles.btnSuccess} onClick={handleGetDirections}>
                                    📍 Chỉ đường
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'menu' && (
                        <div className={styles.menuTab}>
                            {menu.length > 0 ? (
                                <div className={styles.menuGrid}>
                                    {menu.map((item, idx) => (
                                        <div key={idx} className={styles.menuItem}>
                                            {item.image && (
                                                <img 
                                                    src={item.image} 
                                                    alt={item.name}
                                                    className={styles.menuImage}
                                                />
                                            )}
                                            <div className={styles.menuInfo}>
                                                <h3 className={styles.menuName}>{item.name}</h3>
                                                {item.description && (
                                                    <p className={styles.menuDescription}>{item.description}</p>
                                                )}
                                                <p className={styles.menuPrice}>
                                                    {item.price?.toLocaleString('vi-VN')}₫
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.noData}>Chưa có thông tin menu</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className={styles.reviewsTab}>
                            {/* Rating Summary Box */}
                            <div className={styles.ratingSummaryBox}>
                                <div className={styles.ratingScoreMain}>
                                    <span className={styles.bigRatingNumber}>{averageRating.toFixed(1)}</span>
                                    <div className={styles.ratingStarsMain}>{'⭐'.repeat(Math.round(averageRating))}</div>
                                    <p className={styles.totalReviewsText}>({totalReviews} đánh giá)</p>
                                </div>
                                
                                {/* Rating Breakdown Bars */}
                                <div className={styles.ratingBreakdown}>
                                    {[5, 4, 3, 2, 1].map(star => {
                                        const count = reviews.filter(r => (r.stars || r.rating) === star).length;
                                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                                        return (
                                            <div key={star} className={styles.ratingBar}>
                                                <span className={styles.starLabel}>{star}★</span>
                                                <div className={styles.barContainer}>
                                                    <div 
                                                        className={styles.barFill} 
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className={styles.starCount}>{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <h3 className={styles.reviewsTitle}>Đánh giá từ Google ({reviews.length}):</h3>
                            {reviews.length > 0 ? (
                                <div className={styles.reviewsList}>
                                    {reviews.map((review, idx) => {
                                        const authorName = review.name || 'User';
                                        const avatarUrl = review.reviewerPhotoUrl;
                                        const fallbackAvatar = 'https://ui-avatars.com/api/?name=' + 
                                            encodeURIComponent(authorName) + 
                                            '&background=667eea&color=fff&size=80';
                                        
                                        return (
                                            <div key={idx} className={styles.reviewItem}>
                                                <div className={styles.reviewHeader}>
                                                    <div className={styles.reviewerInfo}>
                                                        <img 
                                                            src={avatarUrl || fallbackAvatar} 
                                                            alt={authorName}
                                                            className={styles.reviewerAvatar}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = fallbackAvatar;
                                                            }}
                                                        />
                                                        <div>
                                                            <p className={styles.reviewerName}>{authorName}</p>
                                                            <p className={styles.reviewDate}>
                                                                {new Date(review.publishedAtDate).toLocaleDateString('vi-VN')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={styles.reviewRating}>
                                                        {'⭐'.repeat(review.stars || 0)}
                                                    </div>
                                                </div>
                                                <p className={styles.reviewText}>{review.text || review.textTranslated || 'Không có nội dung'}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className={styles.noData}>Chưa có đánh giá</p>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PlaceDetail;
