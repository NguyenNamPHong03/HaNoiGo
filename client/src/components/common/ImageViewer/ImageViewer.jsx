/* eslint-disable react/prop-types */
import { createPortal } from 'react-dom';
import { memo, useCallback, useEffect } from 'react';
import styles from './ImageViewer.module.css';

/**
 * ImageViewer - Fullscreen image lightbox with navigation
 * Usage: <ImageViewer images={[url1, url2]} currentIndex={0} onClose={() => {}} onNavigate={(idx) => {}} />
 */
const ImageViewer = memo(({ images = [], currentIndex = 0, onClose, onNavigate }) => {
    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        // Prevent body scroll when lightbox is open
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [currentIndex, images.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            onNavigate?.(currentIndex - 1);
        }
    }, [currentIndex, onNavigate]);

    const handleNext = useCallback(() => {
        if (currentIndex < images.length - 1) {
            onNavigate?.(currentIndex + 1);
        }
    }, [currentIndex, images.length, onNavigate]);

    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose?.();
        }
    }, [onClose]);

    if (!images || images.length === 0) return null;

    const currentImage = images[currentIndex];
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < images.length - 1;

    return createPortal(
        <div className={styles.overlay} onClick={handleBackdropClick}>
            {/* Close Button */}
            <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            {/* Main Image Container */}
            <div className={styles.imageContainer}>
                <img
                    src={currentImage}
                    alt={`Ảnh ${currentIndex + 1} / ${images.length}`}
                    className={styles.mainImage}
                />
            </div>

            {/* Navigation Arrows */}
            {hasPrev && (
                <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={handlePrev} aria-label="Ảnh trước">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
            )}

            {hasNext && (
                <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={handleNext} aria-label="Ảnh sau">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            )}

            {/* Image Counter */}
            <div className={styles.counter}>
                {currentIndex + 1} / {images.length}
            </div>

            {/* Thumbnail Strip (optional, for many images) */}
            {images.length > 1 && (
                <div className={styles.thumbnailStrip}>
                    {images.map((img, idx) => (
                        <div
                            key={idx}
                            className={`${styles.thumbnail} ${idx === currentIndex ? styles.activeThumbnail : ''}`}
                            onClick={() => onNavigate?.(idx)}
                        >
                            <img src={img} alt={`Thumb ${idx + 1}`} />
                        </div>
                    ))}
                </div>
            )}
        </div>,
        document.body
    );
});

ImageViewer.displayName = 'ImageViewer';

export default ImageViewer;
