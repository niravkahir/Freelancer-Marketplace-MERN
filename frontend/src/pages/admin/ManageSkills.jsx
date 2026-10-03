import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './AdminDashboard.css';

const SKILL_CATEGORIES = [
  'PROGRAMMING', 'DESIGN', 'MARKETING', 'WRITING', 'MANAGEMENT',
  'DATA_SCIENCE', 'AI_ML', 'CLOUD_COMPUTING', 'CYBERSECURITY',
  'DEVOPS', 'MOBILE_DEVELOPMENT', 'WEB_DEVELOPMENT',
  'SOFTWARE_TESTING', 'BUSINESS_ANALYSIS', 'PROJECT_MANAGEMENT', 'OTHER',
];

const ManageSkills = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'PROGRAMMING', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/admin/skills');
      setSkills(data.skills || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/skills', form);
      setShowModal(false);
      setForm({ name: '', category: 'PROGRAMMING', description: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete skill "${name}"?`)) return;
    try {
      await api.delete(`/admin/skills/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="ad-state">Loading...</div>;

  return (
    <div className="ad-page">
      <Link to="/admin" className="btn-back">← Back to Admin</Link>

      <div className="page-header">
        <div>
          <h1>MANAGE SKILLS</h1>
          <p>{skills.length} skills available to freelancers</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Skill
        </button>
      </div>

      {skills.length === 0 ? (
        <div className="ad-state">No skills yet. Add one to get started.</div>
      ) : (
        <div className="ad-users-table">
          {skills.map((s) => (
            <div key={s._id} className="ad-user-row">
              <div className="ad-user-info" style={{ flex: 1 }}>
                <strong>{s.name}</strong>
                <span>{s.category.replace('_', ' ')}</span>
              </div>
              <button
                className="ad-btn-danger"
                onClick={() => handleDelete(s._id, s.name)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>ADD SKILL</h2>
            {error && <div className="sup-error">{error}</div>}
            <form onSubmit={handleAdd} className="sup-form">
              <div className="form-group">
                <label>Skill Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="React.js"
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {SKILL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows="2"
                  placeholder="Brief description (optional)"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Adding...' : 'Add Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSkills;