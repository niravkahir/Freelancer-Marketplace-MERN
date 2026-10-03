import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './AdminDashboard.css';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data.categories || []);
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
      await api.post('/admin/categories', form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await api.delete(`/admin/categories/${id}`);
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
          <h1>MANAGE CATEGORIES</h1>
          <p>{categories.length} categories available to clients</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="ad-state">No categories yet. Add one to get started.</div>
      ) : (
        <div className="ad-users-table">
          {categories.map((c) => (
            <div key={c._id} className="ad-user-row">
              <div className="ad-user-info" style={{ flex: 1 }}>
                <strong>{c.name}</strong>
                <span>{c.description || 'No description'}</span>
              </div>
              <button
                className="ad-btn-danger"
                onClick={() => handleDelete(c._id, c.name)}
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
            <h2>ADD CATEGORY</h2>
            {error && <div className="sup-error">{error}</div>}
            <form onSubmit={handleAdd} className="sup-form">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Web Development"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows="3"
                  placeholder="Brief description (optional)"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategories;