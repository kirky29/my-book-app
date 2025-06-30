'use client'

import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  readOnly = false, 
  size = 'md' 
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleStarClick = (starRating: number) => {
    if (!readOnly && onRatingChange) {
      // If clicking the same star that's already selected, clear the rating
      if (starRating === rating) {
        onRatingChange(0)
      } else {
        onRatingChange(starRating)
      }
    }
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleStarClick(star)}
          disabled={readOnly}
          className={`transition-colors duration-200 ${
            readOnly 
              ? 'cursor-default' 
              : 'cursor-pointer hover:scale-110 active:scale-95'
          }`}
        >
          <Star
            className={`${sizeClasses[size]} transition-colors ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="text-sm text-gray-600 ml-2">
          {rating} star{rating !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
} 