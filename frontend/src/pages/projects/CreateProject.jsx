import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './CreateProject.css';

const CreateProject = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    category: 'Web Development',
    subCategory: '',
    skillsRequired: '',
    experienceLevel: 'Intermediate',
    projectType: 'Fixed',
    deadline: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        projectType: form.projectType,
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
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Writing">Writing</option>
                <option value="Data Science">Data Science</option>
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
            <div className="form-group">
              <label>Project Type</label>
              <select
                name="projectType"
                value={form.projectType}
                onChange={handleChange}
              >
                <option value="Fixed">Fixed Price</option>
                <option value="Hourly">Hourly</option>
              </select>
            </div>
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