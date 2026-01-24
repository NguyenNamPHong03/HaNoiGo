import { User } from 'lucide-react';
import React from 'react';
import type { Review } from '../types/review.types';

interface ReviewerInfoProps {
  review: Review;
}

export const ReviewerInfo: React.FC<ReviewerInfoProps> = ({ review }) => {
  return (
    <div className="flex items-center gap-2">
      {review.user?.avatarUrl ? (
        <img
          src={review.user.avatarUrl}
          alt={review.user.displayName || 'User'}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-4 h-4 text-gray-500" />
        </div>
      )}
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {review.user?.displayName || 'Ẩn danh'}
        </p>
        {review.user?.email && (
          <p className="text-xs text-gray-500 truncate">
            {review.user.email}
          </p>
        )}
      </div>
    </div>
  );
};
