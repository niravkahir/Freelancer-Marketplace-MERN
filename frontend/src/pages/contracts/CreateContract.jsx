import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './ContractDetail.css';

const CreateContract = () => {
  const { proposalId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    startDate: '',
    endDate: '',
    terms: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post('/contracts', {
        proposalId,
        title: form.title,
        description: form.description,
        budget: Number(form.budget),
        startDate: form.startDate,
        endDate: form.endDate,
        terms: form.terms,
      });
      navigate(`/contracts/${data.contractId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create contract');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cd-page">
      <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
      <h1 style={{ marginBottom: '1.5rem', letterSpacing: '0.15em' }}>
        CREATE CONTRACT
      </h1>

      {error && <div className="cd-notice" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="cd-main">
        <div className="cd-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Contract Title *
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.7rem 1rem', borderRadius: '3px', fontFamily: 'inherit' }}
                placeholder="Website Development Agreement"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                required
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.7rem 1rem', borderRadius: '3px', fontFamily: 'inherit', resize: 'vertical' }}
                placeholder="Scope of work..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Budget (₹) *
              </label>
              <input
                name="budget"
                type="number"
                value={form.budget}
                onChange={handleChange}
                required
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.7rem 1rem', borderRadius: '3px', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Start Date *
                </label>
                <input
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.7rem 1rem', borderRadius: '3px', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  End Date *
                </label>
                <input
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.7rem 1rem', borderRadius: '3px', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Terms & Conditions
              </label>
              <textarea
                name="terms"
                value={form.terms}
                onChange={handleChange}
                rows="4"
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.7rem 1rem', borderRadius: '3px', fontFamily: 'inherit', resize: 'vertical' }}
                placeholder="Payment schedule, deliverables, confidentiality..."
              />
            </div>

            <button type="submit" className="cd-btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Contract'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateContract;