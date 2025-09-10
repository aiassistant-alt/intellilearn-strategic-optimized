import React from 'react';
import { FaStar } from 'react-icons/fa';

interface StarRatingProps {
  rating?: number;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating = 5, 
  className = "" 
}) => {
  return (
    <div className={`star-rating-wrapper ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          className={`star-rating ${star <= rating ? 'filled' : ''}`}
        />
      ))}
    </div>
  );
}; 