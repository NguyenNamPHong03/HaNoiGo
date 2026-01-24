import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSubmitReview, useUpdateReview } from '../../hooks/useReviews';
import styles from './ReviewForm.module.css';

/**
 * ReviewForm Component - Form để submit/edit review
 * Có thể hiển thị dạng modal hoặc inline
 * @param {boolean} inline - Nếu true, hiển thị inline thay vì modal
 * @param {object} editingReview - Review đang sửa (nếu có)
 */
const ReviewForm = ({ placeId, placeName, isOpen, onClose, inline = false, editingReview = null }) => {
  const isEditMode = !!editingReview;
  
  const [rating, setRating] = useState(editingReview?.rating || 5);
  const [comment, setComment] = useState(editingReview?.comment || '');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [errors, setErrors] = useState({});

  const submitReview = useSubmitReview(placeId);
  const updateReview = useUpdateReview(placeId);
  
  // ✅ Update form khi editingReview thay đổi
  useEffect(() => {
    if (editingReview) {
      setRating(editingReview.rating);
      setComment(editingReview.comment || '');
      setErrors({});
    } else {
      setRating(5);
      setComment('');
      setErrors({});
    }
  }, [editingReview]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!rating || rating < 1 || rating > 5) {
      newErrors.rating = 'Vui lòng chọn số sao';
    }

    if (!comment.trim()) {
      newErrors.comment = 'Vui lòng nhập nhận xét';
    } else if (comment.trim().length < 10) {
      newErrors.comment = 'Nhận xét phải có ít nhất 10 ký tự';
    } else if (comment.trim().length > 1000) {
      newErrors.comment = 'Nhận xét không được quá 1000 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isEditMode) {
      // ✅ Update existing review
      updateReview.mutate(
        {
          reviewId: editingReview._id,
          updateData: {
            rating,
            comment: comment.trim(),
          },
        },
        {
          onSuccess: () => {
            // Reset form
            setRating(5);
            setComment('');
            setErrors({});
            onClose();
          },
        }
      );
    } else {
      // ✅ Create new review
      submitReview.mutate(
        {
          rating,
          comment: comment.trim(),
        },
        {
          onSuccess: () => {
            // Reset form
            setRating(5);
            setComment('');
            setErrors({});
            onClose();
          },
        }
      );
    }
  };

  // Handle rating click
  const handleRatingClick = (value) => {
    setRating(value);
    setErrors({ ...errors, rating: undefined });
  };

  if (!isOpen) return null;

  // Inline mode - không có backdrop và modalContainer
  if (inline) {
    return (
      <div className={styles.inlineForm}>
        <div className={styles.modal}>
          {/* Header */}
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>Đánh giá</h2>
              <p className={styles.subtitle}>{placeName}</p>
            </div>
            <button
              onClick={onClose}
              className={styles.closeButton}
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Rating Section */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Đánh giá của bạn <span className={styles.required}>*</span>
              </label>
              <div className={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`${
                      styles.star
                    } ${star <= (hoveredRating || rating) ? styles.starActive : ''}`}
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    ★
                  </button>
                ))}
                <span className={styles.ratingText}>
                  {rating > 0 ? `${rating}/5 sao` : 'Chọn số sao'}
                </span>
              </div>
              {errors.rating && (
                <span className={styles.errorText}>{errors.rating}</span>
              )}
            </div>

            {/* Comment Section */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Nhận xét <span className={styles.required}>*</span>
              </label>
              <textarea
                className={styles.textarea}
                placeholder="Chia sẻ trải nghiệm của bạn tại đây (tối thiểu 10 ký tự)..."
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setErrors({ ...errors, comment: undefined });
                }}
                rows={6}
              />
              <div className={styles.textareaFooter}>
                <span className={styles.charCount}>
                  {comment.length}/1000 ký tự
                </span>
              </div>
              {errors.comment && (
                <span className={styles.errorText}>{errors.comment}</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
                disabled={submitReview.isPending || updateReview.isPending}
              >
                Hủy
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={submitReview.isPending || updateReview.isPending}
              >
                {(submitReview.isPending || updateReview.isPending) ? (
                  <>
                    <span className={styles.spinner}></span>
                    {isEditMode ? 'Đang cập nhật...' : 'Đang gửi...'}
                  </>
                ) : (
                  isEditMode ? 'Cập nhật đánh giá' : 'Gửi đánh giá'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Modal mode - có backdrop và modalContainer
  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        onClick={onClose}
      />

      {/* Modal */}
      <div className={styles.modalContainer}>
        <div
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>{isEditMode ? 'Sửa đánh giá' : 'Đánh giá'}</h2>
              <p className={styles.subtitle}>{placeName}</p>
            </div>
            <button
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Đóng"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Rating Stars */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Đánh giá của bạn <span className={styles.required}>*</span>
              </label>
              <div className={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className={styles.starButton}
                  >
                    <svg
                      className={`${styles.star} ${
                        star <= (hoveredRating || rating)
                          ? styles.starFilled
                          : styles.starEmpty
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
                <span className={styles.ratingText}>
                  {rating}/5
                </span>
              </div>
              {errors.rating && (
                <p className={styles.errorMessage}>{errors.rating}</p>
              )}
            </div>

            {/* Comment */}
            <div className={styles.formGroup}>
              <label
                htmlFor="comment"
                className={styles.label}
              >
                Nhận xét của bạn <span className={styles.required}>*</span>
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setErrors({ ...errors, comment: undefined });
                }}
                placeholder="Chia sẻ trải nghiệm của bạn về địa điểm này..."
                className={`${styles.textarea} ${errors.comment ? styles.error : ''}`}
              />
              <div className={styles.textareaFooter}>
                {errors.comment ? (
                  <p className={styles.errorMessage}>{errors.comment}</p>
                ) : (
                  <p className={styles.helperText}>
                    Tối thiểu 10 ký tự
                  </p>
                )}
                <p
                  className={comment.length > 1000 ? styles.charCountError : styles.charCount}
                >
                  {comment.length}/1000
                </p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={onClose}
                className={`${styles.button} ${styles.buttonCancel}`}
                disabled={submitReview.isLoading || updateReview.isLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitReview.isLoading || updateReview.isLoading}
                className={`${styles.button} ${styles.buttonSubmit}`}
              >
                {(submitReview.isLoading || updateReview.isLoading) ? (
                  <>
                    <div className={styles.spinner} />
                    {isEditMode ? 'Đang cập nhật...' : 'Đang gửi...'}
                  </>
                ) : (
                  isEditMode ? 'Cập nhật đánh giá' : 'Gửi đánh giá'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ReviewForm;
