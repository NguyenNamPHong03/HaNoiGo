import { useState, memo } from 'react';
import styles from './DetailPanel.module.css';

const DetailTabs = ({ selectedItem }) => {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <>
            <div className={styles.tabs}>
                <span
                    className={activeTab === 'overview' ? styles.activeTab : ''}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </span>
                <span
                    className={activeTab === 'reviews' ? styles.activeTab : ''}
                    onClick={() => setActiveTab('reviews')}
                >
                    Reviews
                </span>
                <span
                    className={activeTab === 'about' ? styles.activeTab : ''}
                    onClick={() => setActiveTab('about')}
                >
                    About
                </span>
            </div>
            <div className={styles.tabLine}></div>

            {activeTab === 'overview' && (
                <div className={styles.tabContent}>
                    <p className={styles.label}>Description :</p>
                    <p className={styles.descriptionText}>
                        Welcome to {selectedItem.title} Experience a peaceful escape at {selectedItem.title},
                        a modern retreat set on a quiet hillside with stunning views of valleys and starry nights.
                    </p>

                    <div className={styles.mapPreview}>
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.6136776236367!2d105.91251539678954!3d21.0481383!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135a94eb9623555%3A0xa4b8bc07973cde0e!2sVinhomes%20Symphony!5e0!3m2!1svi!2s!4v1766316009768!5m2!1svi!2s"
                            width="100%"
                            height="100%"
                            style={{ border: 0, borderRadius: '12px' }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Property Location"
                        />
                    </div>
                </div>
            )}

            {activeTab === 'reviews' && (
                <div className={styles.tabContent}>
                    <div className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                            <strong>John Doe</strong>
                            <span className={styles.reviewRating}><svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> 5/5</span>
                        </div>
                        <p>Amazing property! The location is perfect and the amenities are top-notch. Highly recommend!</p>
                    </div>
                    <div className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                            <strong>Jane Smith</strong>
                            <span className={styles.reviewRating}><svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> 4.5/5</span>
                        </div>
                        <p>Great experience overall. Beautiful views and very clean. Will definitely come back!</p>
                    </div>
                </div>
            )}

            {activeTab === 'about' && (
                <div className={styles.tabContent}>
                    <p className={styles.label}>About this property :</p>
                    <p className={styles.descriptionText}>
                        {selectedItem.title} is a premium property located in {selectedItem.address}.
                        This stunning property offers modern amenities and breathtaking views.
                        Perfect for families or professionals looking for a peaceful retreat.
                    </p>
                    <p className={styles.descriptionText} style={{ marginTop: '10px' }}>
                        <strong>Price:</strong> {selectedItem.price.toLocaleString('vi-VN')} VND/month<br />
                        <strong>Type:</strong> {selectedItem.type}<br />
                        <strong>Rating:</strong> <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800" style={{ verticalAlign: 'middle', marginRight: '4px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>{selectedItem.rating}/5
                    </p>
                </div>
            )}
        </>
    );
};

const DetailPanel = memo(({ selectedItem }) => {
    if (!selectedItem) return null;

    return (
        <aside className={styles.detailPanel} onWheel={(e) => e.stopPropagation()}>
            <div className={styles.detailImage}>
                <img src={selectedItem.image} alt={selectedItem.title} />
            </div>

            <div className={styles.detailInfo}>
                <div className={styles.detailTitleRow}>
                    <div>
                        <h2>{selectedItem.title}</h2>
                        <div className={styles.detailAddress}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#0066FF" />
                                <circle cx="12" cy="10" r="3" fill="#fff" />
                            </svg>
                            {selectedItem.address}
                        </div>
                    </div>
                    <div className={styles.detailPrice}>
                        {selectedItem.price.toLocaleString('vi-VN')} <span>VND/month</span>
                    </div>
                </div>

                <DetailTabs selectedItem={selectedItem} />

                <div className={styles.actionButtons}>
                    <button className={styles.contactBtn}>Contact Agent</button>
                    <button className={styles.orderBtn}>Order Now</button>
                </div>
            </div>
        </aside>
    );
});

DetailPanel.displayName = 'DetailPanel';

export default DetailPanel;
