import { Edit2, Flag, MessageSquare, ThumbsUp, Trash2 } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import {
    useDeleteReview,
    useMarkReviewHelpful,
    usePlaceReviews,
} from '../../hooks/useReviews';
import { formatAbsoluteDateTime, formatDate } from '../../utils/formatDate';
import ReviewForm from './ReviewForm';
import styles from './ReviewList.module.css';

/**
 * ReviewCard Component - Hiển thị 1 review
 * ✅ Optimized with React.memo to prevent unnecessary re-renders
 */
const ReviewCard = React.memo(({ review, placeId, placeName }) => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const deleteReview = useDeleteReview(placeId);
  const markHelpful = useMarkReviewHelpful(placeId);

  // ✅ Memoize computed values
  const isOwner = useMemo(() => user?._id === review.user?._id, [user?._id, review.user?._id]);
  const isGoogleReview = useMemo(() => review.source === 'google', [review.source]);
  const formattedDate = useMemo(() => formatDate(review.createdAt), [review.createdAt]);
  const absoluteDateTime = useMemo(() => formatAbsoluteDateTime(review.createdAt), [review.createdAt]);
  const stars = useMemo(() => [...Array(5)], []);

  // ✅ Memoize event handlers với useCallback
  const handleDelete = useCallback(() => {
    if (window.confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      deleteReview.mutate(review._id);
    }
  }, [review._id, deleteReview]);

  const handleMarkHelpful = useCallback(() => {
    if (!user) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    markHelpful.mutate(review._id);
  }, [user, review._id, markHelpful]);

  return (
    <div className={styles.reviewCard}>
      {/* Header */}
      <div className={styles.reviewHeader}>
        <div className={styles.userInfo}>
          {/* Avatar */}
          <div className={styles.avatar}>
            {review.user?.avatarUrl ? (
              <img
                src={review.user.avatarUrl}
                alt={review.user.displayName}
                className={styles.avatarImage}
              />
            ) : (
              review.user?.displayName?.charAt(0).toUpperCase() || 'U'
            )}
          </div>

          {/* User info */}
          <div className={styles.userDetails}>
            <div className={styles.userNameRow}>
              <h4 className={styles.userName}>
                {review.user?.displayName || 'Người dùng'}
              </h4>
              {isGoogleReview && (
                <span className={styles.googleBadge}>
                  Google
                </span>
              )}
            </div>
            <p className={styles.reviewDate} title={absoluteDateTime}>
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Actions (chỉ cho owner) */}
        {!isGoogleReview && isOwner && (
          <div className={styles.reviewActions}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`${styles.actionButton} ${styles.edit}`}
              title={isEditing ? "Hủy sửa" : "Sửa đánh giá"}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteReview.isLoading}
              className={`${styles.actionButton} ${styles.delete}`}
              title="Xóa đánh giá"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Inline Edit Form hoặc Review Content */}
      {isEditing ? (
        <ReviewForm
          placeId={placeId}
          placeName={placeName}
          isOpen={true}
          onClose={() => setIsEditing(false)}
          editingReview={review}
          inline={true}
        />
      ) : (
        <>
          {/* Rating */}
          <div className={styles.ratingStars}>
            {stars.map((_, i) => (
              <svg
                key={i}
                className={`${styles.star} ${i < review.rating ? styles.starFilled : styles.starEmpty
                  }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>

          {/* Comment */}
          <p className={styles.reviewComment}>{review.comment}</p>
        </>
      )}

      {/* Images (nếu có) - Chỉ hiển thị khi không edit */}
      {!isEditing && review.images && review.images.length > 0 && (
        <div className={styles.reviewImages}>
          {review.images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Review ${idx + 1}`}
              className={styles.reviewImage}
            />
          ))}
        </div>
      )}

      {/* Footer - Helpful button - Chỉ hiển thị khi không edit */}
      {!isEditing && !isGoogleReview && (
        <div className={styles.reviewFooter}>
          <button
            onClick={handleMarkHelpful}
            disabled={markHelpful.isLoading || isOwner}
            className={styles.helpfulButton}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Hữu ích ({review.helpfulCount || 0})</span>
          </button>

          {!isOwner && (
            <button className={styles.reportButton}>
              <Flag className="w-4 h-4" />
              <span>Báo cáo</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
});

ReviewCard.displayName = 'ReviewCard';

/**
 * ReviewList Component - Hiển thị danh sách reviews
 * ✅ Optimized with useCallback for stable callback references
 */
const ReviewList = ({ placeId, placeName }) => {
  const { data, isLoading, isError, error } = usePlaceReviews(placeId);

  if (isLoading) {
    return (
      <div className={styles.reviewsContainer}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonHeader}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonText}>
                <div className={styles.skeletonLine} />
                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
              </div>
            </div>
            <div className={styles.skeletonText}>
              <div className={styles.skeletonLine} />
              <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>
          {error.response?.data?.message || 'Không thể tải đánh giá'}
        </p>
      </div>
    );
  }

  // Backend đã merge reviews rồi, không cần merge lại
  const allReviews = data?.reviews || [];
  const totalReviews = data?.total || 0;
  const userReviewsCount = data?.userReviewsCount || 0;
  const googleReviewsCount = data?.googleReviewsCount || 0;
  const combinedAverageRating = data?.combinedAverageRating || 0;
  const combinedRatingDistribution = data?.combinedRatingDistribution || {
    fiveStar: 0,
    fourStar: 0,
    threeStar: 0,
    twoStar: 0,
    oneStar: 0
  };

  if (allReviews.length === 0) {
    return (
      <div className={styles.emptyState}>
        <MessageSquare className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>
          Chưa có đánh giá nào
        </h3>
        <p className={styles.emptyDescription}>
          Hãy là người đầu tiên đánh giá địa điểm này!
        </p>
      </div>
    );
  }

  return (
    <div className={styles.reviewsContainer}>
      {/* Rating Summary - Horizontal Design */}
      <div className={styles.ratingSummaryHorizontal}>
        {/* Left: Big Rating Score */}
        <div className={styles.ratingScoreLeft}>
          <h3 className={styles.bigRatingNumber}>{combinedAverageRating.toFixed(1)}</h3>
          <div className={styles.ratingStarsDisplay}>
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={star <= Math.round(combinedAverageRating) ? "#FF8A00" : "#E0E0E0"}
                style={{ marginRight: '4px' }}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <p className={styles.totalReviewsText}>{totalReviews} reviews</p>
        </div>

        {/* Right: Distribution Bars */}
        <div className={styles.distributionBars}>
          {[5, 4, 3, 2, 1].map((starNum) => {
            const key = ['fiveStar', 'fourStar', 'threeStar', 'twoStar', 'oneStar'][5 - starNum];
            const count = combinedRatingDistribution[key] || 0;
            const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div key={starNum} className={styles.distributionRow}>
                <span className={styles.starNumber}>{starNum}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barProgress}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsSimple}>
        <div className={styles.statSimpleItem}>
          <p className={styles.statSimpleLabel}>Tổng số đánh giá</p>
          <p className={styles.statSimpleValue}>{totalReviews}</p>
        </div>
        <div className={styles.statSimpleItem}>
          <p className={styles.statSimpleLabel}>Từ người dùng</p>
          <p className={styles.statSimpleValue} style={{ color: '#2563eb' }}>{userReviewsCount}</p>
        </div>
        <div className={styles.statSimpleItem}>
          <p className={styles.statSimpleLabel}>Từ Google</p>
          <p className={styles.statSimpleValue} style={{ color: '#059669' }}>{googleReviewsCount}</p>
        </div>
      </div>

      {/* Reviews */}
      {allReviews.map((review) => (
        <ReviewCard
          key={review._id}
          review={review}
          placeId={placeId}
          placeName={placeName}
        />
      ))}
    </div>
  );
};

export default ReviewList;
