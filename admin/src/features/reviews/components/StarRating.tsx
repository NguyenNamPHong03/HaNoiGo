import { Star } from 'lucide-react';
import React from 'react';

interface StarRatingProps {
  rating: number;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, className = '' }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={`w-4 h-4 ${
            index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating}</span>
    </div>
  );
};
