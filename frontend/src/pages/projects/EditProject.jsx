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
    category: 'Web Development',
    subCategory: '',
    skillsRequired: '',
    experienceLevel: 'Intermediate',
    projectType: 'Fixed',
    deadline: '',
    status: 'Open',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/projects/${id}`);
        const p = data.project;
        setForm({
          title: p.title || '',
          description: p.description || '',
          budget: p.budget ?? '',
          category: p.category || 'Web Development',
          subCategory: p.subCategory || '',
          skillsRequired: (p.skillsRequired || []).join(', '),
          experienceLevel: p.experienceLevel || 'Intermediate',
          projectType: p.projectType || 'Fixed',
          deadline: p.deadline ? p.deadline.split('T')[0] : '',
          status: p.status || 'Open',
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
        projectType: form.projectType,
        deadline: form.deadline,
        status: form.status,
      };

      await api.put(`/projects/${id}`, payload);
      navigate(`/projects/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="create-project-page"><div className="create-container">Loading...</div></div>;

  const today = new Date().toISOString().split('T')[0];

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
            <textarea name="description" rows="6" value={form.description} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Budget (₹) *</label>
              <input name="budget" type="number" min="0" value={form.budget} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Deadline *</label>
              <input name="deadline" type="date" value={form.deadline} onChange={handleChange} required min={today} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={form.category} onChange={handleChange} required>
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
              <input name="subCategory" value={form.subCategory} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Required Skills (comma separated) *</label>
            <input name="skillsRequired" value={form.skillsRequired} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Experience Level</label>
              <select name="experienceLevel" value={form.experienceLevel} onChange={handleChange}>
                <option value="Entry">Entry</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
            <div className="form-group">
              <label>Project Type</label>
              <select name="projectType" value={form.projectType} onChange={handleChange}>
                <option value="Fixed">Fixed Price</option>
                <option value="Hourly">Hourly</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="create-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate(`/projects/${id}`)}>
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