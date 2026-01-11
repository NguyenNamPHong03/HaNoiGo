import React, { memo } from 'react';
import styles from './PropertyCard.module.css';

const PropertyCard = memo(({ item, isSelected, onClick, index = null }) => {
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
