import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './CreateProject.css';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    category: '',
    subCategory: '',
    skillsRequired: '',
    experienceLevel: 'Intermediate',
    deadline: '',
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // ✅ Load categories + project data
  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, catRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get('/categories'),
        ]);

        const p = projRes.data.project;
        setCategories(catRes.data.categories || []);

        setForm({
          title: p.title || '',
          description: p.description || '',
          budget: p.budget ?? '',
          category: p.category || '',
          subCategory: p.subCategory || '',
          skillsRequired: (p.skillsRequired || []).join(', '),
          experienceLevel: p.experienceLevel || 'Intermediate',
          deadline: p.deadline ? p.deadline.split('T')[0] : '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.deadline < today) {
      setError('Deadline must be a future date');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        budget: Number(form.budget),
        category: form.category,
        subCategory: form.subCategory,
        skillsRequired: form.skillsRequired
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        experienceLevel: form.experienceLevel,
        deadline: form.deadline,
      };

      await api.put(`/projects/${id}`, payload);
      navigate(`/projects/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="create-project-page">
        <div className="create-container">Loading...</div>
      </div>
    );
  }

  return (
    <div className="create-project-page">
      <div className="create-container">
        <div className="create-header">
          <h1>EDIT PROJECT</h1>
          <p>Update your project details</p>
        </div>

        {error && <div className="create-error">{error}</div>}

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label>Project Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              rows="6"
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Budget (₹) *</label>
              <input
                name="budget"
                type="number"
                min="0"
                value={form.budget}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Deadline *</label>
              <input
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
                required
                min={today}
              />
            </div>
          </div>

          <div className="form-row">
            {/* ✅ Category from admin's list */}
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                {categories.length === 0 && (
                  <option value="">No categories available</option>
                )}
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Sub-Category</label>
              <input
                name="subCategory"
                value={form.subCategory}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Required Skills (comma separated) *</label>
            <input
              name="skillsRequired"
              value={form.skillsRequired}
              onChange={handleChange}
              required
            />
          </div>

          {/* ❌ No Project Type, ❌ No Status */}
          <div className="form-group">
            <label>Experience Level</label>
            <select
              name="experienceLevel"
              value={form.experienceLevel}
              onChange={handleChange}
            >
              <option value="Entry">Entry</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          <div className="create-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(`/projects/${id}`)}
            >
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

export default EditProject;