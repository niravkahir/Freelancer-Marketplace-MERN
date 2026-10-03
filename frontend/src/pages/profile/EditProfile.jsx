import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './EditProfile.css';

const EditProfile = () => {
  const { isFreelancer, isClient } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    profilePicture: '',
    title: '',
    bio: '',
    hourlyRate: '',
    experienceYears: '',
    location: '',
    languages: '',
    isAvailable: true,
    education: [],
    portfolio: [],
    companyName: '',
    companyWebsite: '',
    companyDescription: '',
    industry: '',
    companySize: '1-10',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/users/profile');
        const u = data.user || {};
        const p = data.profile || {};

        setForm((f) => ({
          ...f,
          name: u.name || '',
          phone: u.phone || '',
          profilePicture: u.profilePicture || '',
          title: p.title || '',
          bio: p.bio || '',
          hourlyRate: p.hourlyRate ?? '',
          experienceYears: p.experienceYears ?? '',
          location: p.location || '',
          languages: (p.languages || []).join(', '),
          isAvailable: p.isAvailable ?? true,
          education: p.education || [],
          portfolio: p.portfolio || [],
          companyName: p.companyName || '',
          companyWebsite: p.companyWebsite || '',
          companyDescription: p.companyDescription || '',
          industry: p.industry || '',
          companySize: p.companySize || '1-10',
        }));

        if (p.skills && p.skills.length > 0) {
          setSelectedSkills(p.skills);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load available skills (admin's list) for freelancers
  useEffect(() => {
    if (!isFreelancer) return;
    const loadSkills = async () => {
      try {
        const { data } = await api.get('/skills');
        setAvailableSkills(data.skills || []);
      } catch (e) {}
    };
    loadSkills();
  }, [isFreelancer]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleSkill = (name) => {
    setSelectedSkills((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  // ============ PROFILE PICTURE ============
  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Max 5MB.');
      return;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, or WebP allowed.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await api.post('/upload/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setForm((f) => ({ ...f, profilePicture: data.url }));
      setSuccess('Image uploaded! Click Save Changes to apply.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePicture = () => {
    setForm((f) => ({ ...f, profilePicture: '' }));
  };

  // ============ EDUCATION ============
  const addEducation = () => {
    setForm((f) => ({
      ...f,
      education: [...f.education, { degree: '', institution: '', year: '' }],
    }));
  };

  const removeEducation = (index) => {
    setForm((f) => ({
      ...f,
      education: f.education.filter((_, i) => i !== index),
    }));
  };

  const updateEducation = (index, field, value) => {
    setForm((f) => {
      const updated = [...f.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...f, education: updated };
    });
  };

  // ============ PORTFOLIO ============
  const addPortfolio = () => {
    setForm((f) => ({
      ...f,
      portfolio: [...f.portfolio, { title: '', description: '', link: '' }],
    }));
  };

  const removePortfolio = (index) => {
    setForm((f) => ({
      ...f,
      portfolio: f.portfolio.filter((_, i) => i !== index),
    }));
  };

  const updatePortfolio = (index, field, value) => {
    setForm((f) => {
      const updated = [...f.portfolio];
      updated[index] = { ...updated[index], [field]: value };
      return { ...f, portfolio: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        profilePicture: form.profilePicture,
      };

      if (isFreelancer) {
        Object.assign(payload, {
          title: form.title,
          bio: form.bio,
          skills: selectedSkills,
          hourlyRate: Number(form.hourlyRate) || 0,
          experienceYears: Number(form.experienceYears) || 0,
          location: form.location,
          languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
          isAvailable: form.isAvailable,
          education: form.education
            .filter((e) => e.degree && e.institution)
            .map((e) => ({
              degree: e.degree,
              institution: e.institution,
              year: Number(e.year) || null,
            })),
          portfolio: form.portfolio
            .filter((p) => p.title && p.link)
            .map((p) => ({
              title: p.title,
              description: p.description || '',
              link: p.link,
            })),
        });
      }

      if (isClient) {
        Object.assign(payload, {
          companyName: form.companyName,
          companyWebsite: form.companyWebsite,
          companyDescription: form.companyDescription,
          industry: form.industry,
          companySize: form.companySize,
        });
      }

      await api.put('/users/profile', payload);
      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/profile'), 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="edit-loading">Loading...</div>;

  return (
    <div className="edit-page">
      <div className="edit-container">
        <div className="edit-header">
          <h1>EDIT PROFILE</h1>
          <p>Update your information</p>
        </div>

        {error && <div className="edit-error">{error}</div>}
        {success && <div className="edit-success">{success}</div>}

        <form onSubmit={handleSubmit} className="edit-form">
          {/* PROFILE PICTURE */}
          <h2 className="section-title">PROFILE PICTURE</h2>
          <div className="avatar-upload">
            <div className="avatar-preview">
              {form.profilePicture ? (
                <img src={form.profilePicture} alt="Profile" />
              ) : (
                <span className="avatar-initial">
                  {form.name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>

            <div className="avatar-actions">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-upload"
                onClick={handleFileSelect}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : '📷 Upload Picture'}
              </button>

              {form.profilePicture && (
                <button
                  type="button"
                  className="btn-remove-pic"
                  onClick={handleRemovePicture}
                  disabled={uploading}
                >
                  Remove
                </button>
              )}

              <p className="upload-hint">JPG, PNG, or WebP · Max 5MB</p>
            </div>
          </div>

          {/* BASIC */}
          <h2 className="section-title">BASIC INFORMATION</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" />
            </div>
          </div>

          {/* FREELANCER FIELDS */}
          {isFreelancer && (
            <>
              <h2 className="section-title">FREELANCER DETAILS</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Professional Title</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Full Stack Developer"
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input name="location" value={form.location} onChange={handleChange} placeholder="Bangalore, India" />
                </div>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  rows="4"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell clients about your experience..."
                />
              </div>

              {/* Skills multi-select from admin's list */}
              <div className="form-group">
                <label>Skills (pick from admin's list)</label>
                {availableSkills.length === 0 ? (
                  <p className="empty">No skills available yet. Admin will add some soon.</p>
                ) : (
                  <div className="skills-multiselect">
                    {availableSkills.map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        className={`skill-option ${selectedSkills.includes(s.name) ? 'selected' : ''}`}
                        onClick={() => toggleSkill(s.name)}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hourly Rate (₹)</label>
                  <input
                    name="hourlyRate"
                    type="number"
                    min="0"
                    value={form.hourlyRate}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Years of Experience</label>
                  <input
                    name="experienceYears"
                    type="number"
                    min="0"
                    max="50"
                    value={form.experienceYears}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Languages (comma separated)</label>
                <input
                  name="languages"
                  value={form.languages}
                  onChange={handleChange}
                  placeholder="English, Hindi"
                />
              </div>

              {/* Education */}
              <div className="form-group">
                <label>Education</label>
                {form.education.map((edu, i) => (
                  <div key={i} className="dynamic-row">
                    <input
                      placeholder="Degree (e.g. B.Tech CS)"
                      value={edu.degree}
                      onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                    />
                    <input
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) => updateEducation(i, 'institution', e.target.value)}
                    />
                    <input
                      placeholder="Year"
                      type="number"
                      value={edu.year}
                      onChange={(e) => updateEducation(i, 'year', e.target.value)}
                    />
                    <button type="button" className="btn-remove" onClick={() => removeEducation(i)}>
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" className="btn-add" onClick={addEducation}>
                  + Add Education
                </button>
              </div>

              {/* ✅ Portfolio */}
              <div className="form-group">
                <label>Portfolio</label>
                {form.portfolio.map((p, i) => (
                  <div key={i} className="dynamic-row">
                    <input
                      placeholder="Project title"
                      value={p.title}
                      onChange={(e) => updatePortfolio(i, 'title', e.target.value)}
                    />
                    <input
                      placeholder="Description"
                      value={p.description}
                      onChange={(e) => updatePortfolio(i, 'description', e.target.value)}
                    />
                    <input
                      placeholder="Link (https://...)"
                      value={p.link}
                      onChange={(e) => updatePortfolio(i, 'link', e.target.value)}
                    />
                    <button type="button" className="btn-remove" onClick={() => removePortfolio(i)}>
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" className="btn-add" onClick={addPortfolio}>
                  + Add Portfolio
                </button>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={handleChange} />
                  <span>Available for new projects</span>
                </label>
              </div>
            </>
          )}

          {/* CLIENT FIELDS */}
          {isClient && (
            <>
              <h2 className="section-title">COMPANY DETAILS</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Company Name</label>
                  <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="TechCorp Pvt Ltd" />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input name="companyWebsite" value={form.companyWebsite} onChange={handleChange} placeholder="www.techcorp.com" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Industry</label>
                  <input name="industry" value={form.industry} onChange={handleChange} placeholder="Information Technology" />
                </div>
                <div className="form-group">
                  <label>Company Size</label>
                  <select name="companySize" value={form.companySize} onChange={handleChange}>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Company Description</label>
                <textarea name="companyDescription" rows="4" value={form.companyDescription} onChange={handleChange} placeholder="What does your company do?" />
              </div>
            </>
          )}

          <div className="edit-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/profile')}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;