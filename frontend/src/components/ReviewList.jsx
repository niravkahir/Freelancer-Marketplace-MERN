import { useEffect, useState } from 'react';
import api from '../services/api';
import './ReviewList.css';

const ReviewList = ({ userId }) => {
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        const { data } = await api.get(`/reviews/user/${userId}`);
        setReviews(data.reviews || []);
        setAverage(data.averageRating || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) return null;
  if (reviews.length === 0) return null;

  return (
    <div className="review-list">
      <div className="review-list-header">
        <h3>REVIEWS</h3>
        <span className="review-avg">
          ⭐ {average}/5 · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="review-items">
        {reviews.map((r) => (
          <div key={r._id} className="review-item">
            <div className="review-item-top">
              <div className="review-item-user">
                <div className="review-item-avatar">
                  {r.reviewerId?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <strong>{r.reviewerId?.name}</strong>
                  <span className="review-item-project">
                    {r.projectId?.title || 'Project'}
                  </span>
                </div>
              </div>
              <div className="review-item-stars">
                {'★'.repeat(r.rating)}
                <span className="review-item-empty">{'★'.repeat(5 - r.rating)}</span>
              </div>
            </div>

            {r.comment && <p className="review-item-comment">{r.comment}</p>}

            <span className="review-item-date">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;