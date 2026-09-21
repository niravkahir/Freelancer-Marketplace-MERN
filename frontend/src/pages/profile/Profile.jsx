import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user: authUser, isFreelancer, isClient } = useAuth();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/users/profile');
        setUser(data.user);
        setProfile(data.profile);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!user) return null;

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {user.name?.charAt(0).toUpperCase()}
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
            {isFreelancer && profile?.location && <span>📍 {profile.location}</span>}
            {isClient && profile?.location && <span>📍 {profile.location}</span>}
            {isClient && profile?.verified && <span className="verified">✅ Verified</span>}
          </div>
        </div>
        <div className="profile-actions">
          <Link to="/profile/edit" className="btn-primary">Edit Profile</Link>
        </div>
      </div>

      {/* Body */}
      <div className="profile-grid">
        {/* Contact */}
        <div className="profile-card">
          <h3>Contact</h3>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone || 'Not added'}</p>
        </div>

        {/* Freelancer specific */}
        {isFreelancer && (
          <>
            <div className="profile-card">
              <h3>About</h3>
              <p>{profile?.bio || 'No bio added yet.'}</p>
            </div>

            <div className="profile-card">
              <h3>Skills</h3>
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
              <h3>Stats</h3>
              <p><strong>Hourly Rate:</strong> ₹{profile?.hourlyRate || 0}/hr</p>
              <p><strong>Experience:</strong> {profile?.experienceYears || 0} years</p>
              <p><strong>Rating:</strong> ⭐ {profile?.rating || 0}/5</p>
              <p><strong>Projects Completed:</strong> {profile?.projectsCompleted || 0}</p>
              <p><strong>Total Earnings:</strong> ₹{profile?.totalEarnings || 0}</p>
              <p><strong>Availability:</strong> {profile?.isAvailable ? '✅ Available' : '❌ Not Available'}</p>
            </div>

            <div className="profile-card">
              <h3>Languages</h3>
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

            {/* <div className="profile-card">
              <h3>Portfolio</h3>
              {profile?.portfolio?.length > 0 ? (
                <div className="portfolio-list">
                  {profile.portfolio.map((p, i) => (
                    <div key={i} className="portfolio-item">
                      <h4>{p.title}</h4>
                      <p>{p.description}</p>
                      {p.link && (
                        <a href={p.link} target="_blank" rel="noreferrer">View →</a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty">No portfolio items</p>
              )}
            </div> */}

            <div className="profile-card">
              <h3>Education</h3>
              {profile?.education?.length > 0 ? (
                profile.education.map((e, i) => (
                  <p key={i}><strong>{e.degree}</strong> — {e.institution} ({e.year})</p>
                ))
              ) : (
                <p className="empty">No education added</p>
              )}
            </div>

            {/* <div className="profile-card">
              <h3>Certifications</h3>
              {profile?.certifications?.length > 0 ? (
                profile.certifications.map((c, i) => (
                  <p key={i}><strong>{c.name}</strong> — {c.issuer} ({c.year})</p>
                ))
              ) : (
                <p className="empty">No certifications added</p>
              )}
            </div> */}
          </>
        )}

        {/* Client specific */}
        {isClient && (
          <>
            <div className="profile-card">
              <h3>Company</h3>
              <p><strong>Name:</strong> {profile?.companyName || 'Not added'}</p>
              <p><strong>Website:</strong> {profile?.companyWebsite || 'Not added'}</p>
              <p><strong>Industry:</strong> {profile?.industry || 'Not added'}</p>
              <p><strong>Size:</strong> {profile?.companySize || 'Not added'}</p>
            </div>

            <div className="profile-card">
              <h3>About Company</h3>
              <p>{profile?.companyDescription || 'No description added yet.'}</p>
            </div>

            <div className="profile-card">
              <h3>Stats</h3>
              <p><strong>Projects Posted:</strong> {profile?.totalProjectsPosted || 0}</p>
              <p><strong>Average Budget:</strong> ₹{profile?.averageBudget || 0}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;