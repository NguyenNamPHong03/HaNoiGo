import { MessageCircle, ThumbsUp } from 'lucide-react';
import React from 'react';

interface Review {
  _id: string;
  source?: 'google' | 'user';
  rating: number;
  comment: string;
  user: {
    username: string;
    displayName: string;
    avatar?: string | null;
  };
  createdAt: string | null;
  helpfulCount: number;
  images?: string[];
}

interface ReviewListProps {
  reviews: Review[];
  showSource?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, showSource = true }) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-lg">Chưa có đánh giá nào</p>
        <p className="text-sm mt-1">Hãy là người đầu tiên đánh giá địa điểm này!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review._id} className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {review.user.avatar ? (
                <img
                  src={review.user.avatar}
                  alt={review.user.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {review.user.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>

            {/* Review Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{review.user.displayName}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                    {showSource && review.source === 'google' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Google Review
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Comment */}
              <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {review.images.slice(0, 3).map((image, idx) => (
                    <img
                      key={idx}
                      src={image}
                      alt={`Review image ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* Footer - Helpful count */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{review.helpfulCount} người thấy hữu ích</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
