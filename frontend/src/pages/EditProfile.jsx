import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './EditProfile.css';

const EditProfile = () => {
  const { isFreelancer, isClient } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    // Freelancer
    title: '',
    bio: '',
    skills: '',
    hourlyRate: '',
    experienceYears: '',
    location: '',
    languages: '',
    isAvailable: true,
    education: [],   // ✅ NEW
    // Client
    companyName: '',
    companyWebsite: '',
    companyDescription: '',
    industry: '',
    companySize: '1-10',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          title: p.title || '',
          bio: p.bio || '',
          skills: (p.skills || []).join(', '),
          hourlyRate: p.hourlyRate ?? '',
          experienceYears: p.experienceYears ?? '',
          location: p.location || '',
          languages: (p.languages || []).join(', '),
          isAvailable: p.isAvailable ?? true,
          education: p.education || [],   // ✅ NEW
          companyName: p.companyName || '',
          companyWebsite: p.companyWebsite || '',
          companyDescription: p.companyDescription || '',
          industry: p.industry || '',
          companySize: p.companySize || '1-10',
        }));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  // ✅ Education handlers
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = { name: form.name, phone: form.phone };

      if (isFreelancer) {
        Object.assign(payload, {
          title: form.title,
          bio: form.bio,
          skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
          hourlyRate: Number(form.hourlyRate) || 0,
          experienceYears: Number(form.experienceYears) || 0,
          location: form.location,
          languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
          isAvailable: form.isAvailable,
          // ✅ Clean education before sending
          education: form.education
            .filter((e) => e.degree && e.institution)
            .map((e) => ({
              degree: e.degree,
              institution: e.institution,
              year: Number(e.year) || null,
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
                  <input name="title" value={form.title} onChange={handleChange} placeholder="Full Stack Developer" />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input name="location" value={form.location} onChange={handleChange} placeholder="Bangalore, India" />
                </div>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea name="bio" rows="4" value={form.bio} onChange={handleChange} placeholder="Tell clients about your experience..." />
              </div>

              <div className="form-group">
                <label>Skills (comma separated)</label>
                <input name="skills" value={form.skills} onChange={handleChange} placeholder="React, Node.js, MongoDB" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hourly Rate (₹)</label>
                  <input name="hourlyRate" type="number" min="0" value={form.hourlyRate} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Years of Experience</label>
                  <input name="experienceYears" type="number" min="0" max="50" value={form.experienceYears} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Languages (comma separated)</label>
                <input name="languages" value={form.languages} onChange={handleChange} placeholder="English, Hindi" />
              </div>

              {/* ✅ EDUCATION SECTION */}
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
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeEducation(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button type="button" className="btn-add" onClick={addEducation}>
                  + Add Education
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