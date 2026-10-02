import { useState } from 'react';
import api from '../services/api';
import './ReviewForm.css';

const ReviewForm = ({ contractId, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Please select a rating');
      return;
    }
    setSaving(true);
    setError('');

    try {
      await api.post('/reviews', {
        contractId,
        rating,
        comment: comment.trim(),
      });
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <h4>RATE YOUR EXPERIENCE</h4>

      {error && <div className="review-error">{error}</div>}

      <div className="review-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= (hover || rating) ? 'active' : ''}`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
          >
            ★
          </span>
        ))}
        {rating > 0 && (
          <span className="review-rating-text">{rating}/5</span>
        )}
      </div>

      <textarea
        placeholder="Share your experience (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows="3"
        maxLength={1000}
      />

      <button type="submit" disabled={saving || !rating}>
        {saving ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

export default ReviewForm;