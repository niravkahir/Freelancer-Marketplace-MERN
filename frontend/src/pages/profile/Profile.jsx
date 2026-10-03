import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ReviewList from '../../components/ReviewList';
import './Profile.css';

const Profile = () => {
  const { id } = useParams();   // present only on /users/:id
  const { user: authUser } = useAuth();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [rating, setRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ✅ If :id exists → it's someone else's profile
  // ✅ If no :id → it's my own profile
  const isOwnProfile = !id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let data;
        if (isOwnProfile) {
          // Own profile — /api/users/profile
          const res = await api.get('/users/profile');
          data = { user: res.data.user, profile: res.data.profile };
        } else {
          // Someone else's — /api/users/:id/profile
          const res = await api.get(`/users/${id}/profile`);
          data = {
            user: res.data.user,
            profile: res.data.profile,
            rating: res.data.rating,
            totalReviews: res.data.totalReviews,
          };
        }
        setUser(data.user);
        setProfile(data.profile);
        setRating(data.rating || 0);
        setTotalReviews(data.totalReviews || 0);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, isOwnProfile]);

  if (loading) return <div className="profile-loading">Loading...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!user) return null;

  const isFreelancer = user.role === 'FREELANCER';
  const isClient = user.role === 'CLIENT';

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {user.profilePicture && user.profilePicture !== 'default-avatar.png' ? (
            <img src={user.profilePicture} alt={user.name} />
          ) : (
            user.name?.charAt(0).toUpperCase()
          )}
        </div>
        <div className="profile-header-info">
          <h1>{user.name}</h1>
          <p className="profile-title">
            {isFreelancer && (profile?.title || 'Freelancer')}
            {isClient && (profile?.companyName || 'Client')}
            {user.role === 'ADMIN' && 'Administrator'}
          </p>
          <div className="profile-meta">
            <span className="role-badge">{user.role}</span>
            {profile?.location && <span>📍 {profile.location}</span>}
            {isClient && profile?.verified && (
              <span className="verified">✅ Verified</span>
            )}
            {isClient && !profile?.verified && isOwnProfile && (
              <span className="pending-verify">⏳ Pending Verification</span>
            )}
          </div>
        </div>

        {/* ✅ Only show Edit button on OWN profile */}
        {isOwnProfile && (
          <div className="profile-actions">
            <Link to="/profile/edit" className="btn-primary">Edit Profile</Link>
          </div>
        )}
      </div>

      <div className="profile-grid">
        {/* ================== FREELANCER ================== */}
        {isFreelancer && (
          <>
            <div className="profile-card">
              <h3>CONTACT</h3>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Phone:</strong> {user.phone || 'Not added'}</p>
            </div>

            <div className="profile-card">
              <h3>ABOUT</h3>
              <p>{profile?.bio || 'No bio added yet.'}</p>
            </div>

            <div className="profile-card">
              <h3>SKILLS</h3>
              <div className="skills-list">
                {profile?.skills?.length > 0 ? (
                  profile.skills.map((s, i) => (
                    <span key={i} className="skill-tag">{s}</span>
                  ))
                ) : (
                  <p className="empty">No skills added</p>
                )}
              </div>
            </div>

            <div className="profile-card">
              <h3>STATS</h3>
              <p><strong>Hourly Rate:</strong> ₹{profile?.hourlyRate || 0}/hr</p>
              <p><strong>Experience:</strong> {profile?.experienceYears || 0} years</p>
              <p>
                <strong>Rating:</strong>{' '}
                ⭐ {rating > 0 ? `${rating}/5` : 'No rating yet'}
                {totalReviews > 0 &&
                  ` (${totalReviews} review${totalReviews !== 1 ? 's' : ''})`}
              </p>
              <p><strong>Projects Completed:</strong> {profile?.projectsCompleted || 0}</p>
              {isOwnProfile && (
                <p><strong>Total Earnings:</strong> ₹{profile?.totalEarnings || 0}</p>
              )}
              <p>
                <strong>Availability:</strong>{' '}
                {profile?.isAvailable ? '✅ Available' : '❌ Not Available'}
              </p>
            </div>

            <div className="profile-card">
              <h3>LANGUAGES</h3>
              <div className="skills-list">
                {profile?.languages?.length > 0 ? (
                  profile.languages.map((l, i) => (
                    <span key={i} className="skill-tag">{l}</span>
                  ))
                ) : (
                  <p className="empty">No languages added</p>
                )}
              </div>
            </div>

            <div className="profile-card">
              <h3>PORTFOLIO</h3>
              {profile?.portfolio?.length > 0 ? (
                <div className="portfolio-list">
                  {profile.portfolio.map((p, i) => (
                    <div key={i} className="portfolio-item">
                      <h4>{p.title}</h4>
                      {p.description && <p>{p.description}</p>}
                      {p.link && (
                        <a href={p.link} target="_blank" rel="noreferrer">
                          View →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty">No portfolio items</p>
              )}
            </div>

            <div className="profile-card">
              <h3>EDUCATION</h3>
              {profile?.education?.length > 0 ? (
                profile.education.map((e, i) => (
                  <p key={i}>
                    <strong>{e.degree}</strong> — {e.institution} ({e.year})
                  </p>
                ))
              ) : (
                <p className="empty">No education added</p>
              )}
            </div>
          </>
        )}

        {/* ================== CLIENT ================== */}
        {isClient && (
          <>
            <div className="profile-card">
              <h3>CONTACT</h3>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Phone:</strong> {user.phone || 'Not added'}</p>
            </div>

            <div className="profile-card">
              <h3>COMPANY</h3>
              <p><strong>Name:</strong> {profile?.companyName || 'Not added'}</p>
              <p><strong>Website:</strong> {profile?.companyWebsite || 'Not added'}</p>
              <p><strong>Industry:</strong> {profile?.industry || 'Not added'}</p>
              <p><strong>Size:</strong> {profile?.companySize || 'Not added'}</p>
              <p>
                <strong>Rating:</strong>{' '}
                ⭐ {rating > 0 ? `${rating}/5` : 'No rating yet'}
                {totalReviews > 0 &&
                  ` (${totalReviews} review${totalReviews !== 1 ? 's' : ''})`}
              </p>
            </div>

            <div className="profile-card">
              <h3>ABOUT COMPANY</h3>
              <p>{profile?.companyDescription || 'No description added yet.'}</p>
            </div>

            {isOwnProfile && (
              <div className="profile-card">
                <h3>STATS</h3>
                <p><strong>Projects Posted:</strong> {profile?.totalProjectsPosted || 0}</p>
                <p><strong>Average Budget:</strong> ₹{profile?.averageBudget || 0}</p>
              </div>
            )}
          </>
        )}

        {/* Reviews — full width */}
        <div className="profile-card" style={{ gridColumn: '1 / -1' }}>
          <ReviewList userId={user._id} />
        </div>
      </div>
    </div>
  );
};

export default Profile;