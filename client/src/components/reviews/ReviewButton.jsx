import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import ReviewForm from './ReviewForm';
import styles from './ReviewButton.module.css';

/**
 * ReviewButton Component - Nút trigger modal đánh giá
 * Check authentication trước khi mở form
 */
const ReviewButton = ({ placeId, placeName }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useUser();

  const handleClick = () => {
    if (!user) {
      // Redirect to login nếu chưa đăng nhập
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    setIsFormOpen(true);
  };

  return (
    <div className={styles.container}>
      <button
        onClick={handleClick}
        className={styles.reviewButton}
      >
        <MessageSquare className={styles.icon} />
        Viết đánh giá
      </button>

      {/* Review Form Inline */}
      {user && (
        <ReviewForm
          placeId={placeId}
          placeName={placeName}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          inline={true}
        />
      )}
    </div>
  );
};

export default ReviewButton;
