import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './CreateProject.css';

const CreateProject = () => {
  const navigate = useNavigate();
  const { isClient } = useAuth();

  const [categories, setCategories] = useState([]);
  const [isVerified, setIsVerified] = useState(true);
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // ✅ Load categories + check verification
  useEffect(() => {
    const init = async () => {
      try {
        const [catRes, profRes] = await Promise.all([
          api.get('/categories'),
          api.get('/users/profile'),
        ]);

        const cats = catRes.data.categories || [];
        setCategories(cats);

        if (cats.length > 0 && !form.category) {
          setForm((f) => ({ ...f, category: cats[0].name }));
        }

        // Check client verification
        if (isClient) {
          setIsVerified(profRes.data.profile?.verified || false);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, [isClient]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isVerified) {
      setError('Your account is not verified yet. Please wait for admin approval.');
      return;
    }

    if (form.deadline < today) {
      setError('Deadline must be a future date');
      return;
    }

    setLoading(true);

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

      const { data } = await api.post('/projects', payload);
      navigate(`/projects/${data.projectId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Block unverified clients
  if (isClient && !isVerified) {
    return (
      <div className="create-project-page">
        <div className="create-container">
          <div className="create-header">
            <h1>POST A NEW PROJECT</h1>
          </div>
          <div className="create-error" style={{ textAlign: 'center', padding: '2rem' }}>
            ⏳ Your account is pending verification.
            <br />
            <br />
            Please complete your profile. An admin will verify your account shortly.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-project-page">
      <div className="create-container">
        <div className="create-header">
          <h1>POST A NEW PROJECT</h1>
          <p>Describe what you need — freelancers will apply</p>
        </div>

        {error && <div className="create-error">{error}</div>}

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label>Project Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="E-Commerce Website Development"
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              rows="6"
              value={form.description}
              onChange={handleChange}
              required
              placeholder="Describe the project scope, features, and expectations..."
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
                placeholder="50000"
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
            {/* ✅ Category from API */}
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                {categories.length === 0 && <option value="">No categories available</option>}
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Sub-Category</label>
              <input
                name="subCategory"
                value={form.subCategory}
                onChange={handleChange}
                placeholder="E-Commerce"
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
              placeholder="React, Node.js, MongoDB"
            />
          </div>

          <div className="form-row">
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
            {/* ❌ Project Type removed — always Fixed */}
          </div>

          <div className="create-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/projects')}
            >
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Posting...' : 'Post Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;