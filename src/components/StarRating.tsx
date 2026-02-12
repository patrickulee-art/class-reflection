'use client';

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
}

export default function StarRating({ rating, onChange }: StarRatingProps) {
  return (
    <div className="stars-container">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onChange(star === rating ? 0 : star);
          }}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
}
