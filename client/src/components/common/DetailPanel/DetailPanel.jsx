import { memo, useState } from 'react';
import styles from './DetailPanel.module.css';

const DetailTabs = ({ selectedItem }) => {
    const [activeTab, setActiveTab] = useState('overview');

    // Get real data from database
    const place = selectedItem._originalPlace || selectedItem;
    const name = place.name || selectedItem.title;
    const description = place.description || `Welcome to ${name}`;
    const address = place.address || selectedItem.address;
    const category = place.category || selectedItem.type;
    const priceRange = place.priceRange || { min: selectedItem.price, max: selectedItem.price };
    const district = place.district || '';
    const menu = place.menu || [];
    const operatingHours = place.operatingHours || {};
    const contact = place.contact || {};
    const aiTags = place.aiTags || {};
    const averageRating = place.averageRating || selectedItem.rating || 0;
    const totalReviews = place.totalReviews || selectedItem.reviews || 0;

    // Debug: Log operatingHours để kiểm tra
    console.log('🕐 Operating Hours Data:', operatingHours);
    console.log('🕐 Place object:', place);

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
                    <p className={styles.label}>Mô tả:</p>
                    <p className={styles.descriptionText}>
                        {description}
                    </p>

                    {/* Thông tin chi tiết - chuyển từ tab Chi tiết */}
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
                                    ? `${priceRange.min.toLocaleString('vi-VN')}₫`
                                    : `${priceRange.min.toLocaleString('vi-VN')}₫ - ${priceRange.max.toLocaleString('vi-VN')}₫`
                                }
                            </span>
                        </div>
                    </div>

                    {/* AI Tags */}
                    {aiTags && Object.keys(aiTags).some(key => aiTags[key]?.length > 0) && (
                        <div className={styles.tagsSection}>
                            <p className={styles.label}>Đặc điểm nổi bật:</p>
                            <div className={styles.tagsList}>
                                {aiTags.space?.map((tag, idx) => (
                                    <span key={idx} className={styles.tag}>{tag}</span>
                                ))}
                                {aiTags.mood?.map((tag, idx) => (
                                    <span key={idx} className={styles.tag}>{tag}</span>
                                ))}
                                {aiTags.suitability?.map((tag, idx) => (
                                    <span key={idx} className={styles.tag}>{tag}</span>
                                ))}
                                {aiTags.specialFeatures?.map((tag, idx) => (
                                    <span key={idx} className={styles.tag}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Additional AI Tags */}
                    {(aiTags?.crowdLevel?.length > 0 || aiTags?.music?.length > 0 || aiTags?.parking?.length > 0) && (
                        <div className={styles.additionalInfo}>
                            <p className={styles.label}>Thông tin bổ sung:</p>
                            {aiTags.crowdLevel?.length > 0 && (
                                <p><strong>Mức độ đông:</strong> {aiTags.crowdLevel.join(', ')}</p>
                            )}
                            {aiTags.music?.length > 0 && (
                                <p><strong>Âm nhạc:</strong> {aiTags.music.join(', ')}</p>
                            )}
                            {aiTags.parking?.length > 0 && (
                                <p><strong>Đỗ xe:</strong> {aiTags.parking.join(', ')}</p>
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
                                    📞 {contact.phone}
                                </p>
                            )}
                            {contact.website && (
                                <p className={styles.contactItem}>
                                    🌐 <a href={contact.website} target="_blank" rel="noopener noreferrer">
                                        {contact.website}
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
                            <p className={styles.label}>Thực đơn:</p>
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
                        <p className={styles.noData}>Chưa có thông tin menu</p>
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
                                        <svg key={star} width="18" height="18" viewBox="0 0 24 24" fill={star <= Math.round(averageRating) ? "#FFB800" : "#E0E0E0"}>
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    ))}
                                </div>
                                <p className={styles.ratingCount}>({totalReviews} đánh giá)</p>
                            </div>
                        </div>
                    </div>

                    {/* Review Form */}
                    <div className={styles.reviewForm}>
                        <p className={styles.label}>Viết đánh giá của bạn:</p>
                        <div className={styles.starRating}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} width="24" height="24" viewBox="0 0 24 24" fill="#E0E0E0" className={styles.starInput}>
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            ))}
                        </div>
                        <textarea 
                            className={styles.reviewTextarea} 
                            placeholder="Chia sẻ trải nghiệm của bạn về địa điểm này..."
                            rows={4}
                        />
                        <button className={styles.submitReviewBtn}>Gửi đánh giá</button>
                    </div>

                    {/* Reviews List */}
                    <div className={styles.reviewsList}>
                        <p className={styles.label}>Đánh giá từ khách hàng:</p>
                        
                        {/* Mock reviews - sẽ thay bằng dữ liệu thật sau */}
                        <div className={styles.reviewItem}>
                            <div className={styles.reviewHeader}>
                                <div className={styles.reviewerInfo}>
                                    <div className={styles.reviewerAvatar}>👤</div>
                                    <div>
                                        <strong className={styles.reviewerName}>Nguyễn Văn A</strong>
                                        <div className={styles.reviewRating}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <svg key={star} width="12" height="12" viewBox="0 0 24 24" fill="#FFB800">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span className={styles.reviewDate}>2 ngày trước</span>
                            </div>
                            <p className={styles.reviewText}>
                                Địa điểm rất tuyệt vời! Không gian ấm cúng, phục vụ nhiệt tình. Đồ ăn ngon và giá cả hợp lý. Sẽ quay lại lần sau!
                            </p>
                        </div>

                        <div className={styles.reviewItem}>
                            <div className={styles.reviewHeader}>
                                <div className={styles.reviewerInfo}>
                                    <div className={styles.reviewerAvatar}>👤</div>
                                    <div>
                                        <strong className={styles.reviewerName}>Trần Thị B</strong>
                                        <div className={styles.reviewRating}>
                                            {[1, 2, 3, 4].map((star) => (
                                                <svg key={star} width="12" height="12" viewBox="0 0 24 24" fill="#FFB800">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                </svg>
                                            ))}
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#E0E0E0">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <span className={styles.reviewDate}>1 tuần trước</span>
                            </div>
                            <p className={styles.reviewText}>
                                Khá ổn, view đẹp nhưng hơi ồn vào cuối tuần. Nhìn chung vẫn đáng để thử.
                            </p>
                        </div>

                        {totalReviews === 0 && (
                            <p className={styles.noData}>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

const DetailPanel = memo(({ selectedItem }) => {
    if (!selectedItem) return null;

    // Get real data from database
    const place = selectedItem._originalPlace || selectedItem;
    const name = place.name || selectedItem.title;
    const address = place.address || selectedItem.address;
    const priceRange = place.priceRange || { min: selectedItem.price, max: selectedItem.price };
    const images = place.images || [selectedItem.image];
    const mainImage = images[0] || selectedItem.image;

    return (
        <aside className={styles.detailPanel} onWheel={(e) => e.stopPropagation()}>
            <div className={styles.detailImage}>
                <img src={mainImage} alt={name} />
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
                    <div className={styles.detailPrice}>
                        {priceRange.min === priceRange.max 
                            ? priceRange.min.toLocaleString('vi-VN')
                            : `${priceRange.min.toLocaleString('vi-VN')} - ${priceRange.max.toLocaleString('vi-VN')}`
                        } <span>₫</span>
                    </div>
                </div>

                <DetailTabs selectedItem={selectedItem} />

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
