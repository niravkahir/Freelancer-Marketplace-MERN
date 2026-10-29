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

  // AI states
  const [aiKeywords, setAiKeywords] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [suggestingSkills, setSuggestingSkills] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

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

  // Generate description with AI
  const handleGenerateDescription = async () => {
    if (aiKeywords.trim().length < 5) {
      setAiError('Please write at least 5 characters');
      return;
    }

    setGenerating(true);
    setAiError('');

    try {
      const skillsArray = form.skillsRequired
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const { data } = await api.post('/ai/generate-description', {
        keywords: aiKeywords,
        title: form.title,
        category: form.category,
        skillsRequired: skillsArray,
      });

      setForm((f) => ({ ...f, description: data.description }));
      setAiError('');
    } catch (err) {
      setAiError(
        err.response?.data?.message || 'Failed to generate description'
      );
    } finally {
      setGenerating(false);
    }
  };

  // Suggest skills with AI
  const handleSuggestSkills = async () => {
    if (!form.title || !form.description) {
      setAiError('Please add title and description first');
      return;
    }

    setSuggestingSkills(true);
    setAiError('');

    try {
      const { data } = await api.post('/ai/suggest-skills', {
        title: form.title,
        description: form.description,
      });

      setForm((f) => ({
        ...f,
        skillsRequired: data.skills.join(', '),
      }));
    } catch (err) {
      setAiError(err.response?.data?.message || 'Failed to suggest skills');
    } finally {
      setSuggestingSkills(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isVerified) {
      setError('Your account is not verified yet.');
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

  if (isClient && !isVerified) {
    return (
      <div className="create-project-page">
        <div className="create-container">
          <div className="create-header">
            <h1>POST A NEW PROJECT</h1>
          </div>
          <div className="create-error" style={{ textAlign: 'center', padding: '2rem' }}>
            ⏳ Your account is pending verification.
            <br /><br />
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
          {/* AI HELPER PANEL */}
          <div className="ai-helper-box">
            <div className="ai-helper-header">
              <span className="ai-icon">✨</span>
              <div>
                <h3>AI Writing Assistant</h3>
                <p>Not sure how to describe your project? Type a simple idea and let AI write it for you.</p>
              </div>
            </div>

            <div className="ai-input-row">
              <input
                type="text"
                value={aiKeywords}
                onChange={(e) => setAiKeywords(e.target.value)}
                placeholder="e.g., app to sell clothes online, or website for connecting investors"
                disabled={generating}
              />
              <button
                type="button"
                className="ai-btn"
                onClick={handleGenerateDescription}
                disabled={generating || aiKeywords.trim().length < 5}
              >
                {generating ? '⏳ Generating...' : '✨ Generate'}
              </button>
            </div>

            {aiError && <div className="ai-error">{aiError}</div>}
          </div>

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
              rows="8"
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
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                {categories.length === 0 && <option value="">No categories</option>}
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
            <label>
              Required Skills (comma separated) *
              {form.title && form.description && (
                <button
                  type="button"
                  className="ai-suggest-btn"
                  onClick={handleSuggestSkills}
                  disabled={suggestingSkills}
                >
                  {suggestingSkills ? '⏳' : '💡 Suggest with AI'}
                </button>
              )}
            </label>
            <input
              name="skillsRequired"
              value={form.skillsRequired}
              onChange={handleChange}
              required
              placeholder="React, Node.js, MongoDB"
            />
          </div>

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