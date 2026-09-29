import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import './Support.css';

const CATEGORIES = [
  { value: 'ACCOUNT_ISSUE', label: 'Account Issue', icon: '👤' },
  { value: 'PAYMENT_ISSUE', label: 'Payment Issue', icon: '💳' },
  { value: 'PROJECT_ISSUE', label: 'Project Issue', icon: '📁' },
  { value: 'TECHNICAL_ISSUE', label: 'Technical Issue', icon: '🔧' },
  { value: 'COMPLAINT', label: 'Complaint', icon: '⚠️' },
  { value: 'FEEDBACK', label: 'Feedback', icon: '💬' },
  { value: 'GENERAL_QUERY', label: 'General Query', icon: '❓' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request', icon: '✨' },
  { value: 'BUG_REPORT', label: 'Bug Report', icon: '🐛' },
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const Support = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { socket } = useSocket();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    category: 'GENERAL_QUERY',
    priority: 'MEDIUM',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/support');
      setTickets(data.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const onChanged = () => load();
    socket.on('ticketChanged', onChanged);
    return () => socket.off('ticketChanged', onChanged);
  }, [socket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await api.post('/support', form);
      setShowModal(false);
      setForm({
        subject: '',
        category: 'GENERAL_QUERY',
        priority: 'MEDIUM',
        description: '',
      });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSaving(false);
    }
  };

  // ✅ Admin opens admin panel view, users open their own view
  const handleCardClick = (ticketId) => {
    if (isAdmin) {
      navigate(`/admin/support/${ticketId}`);
    } else {
      navigate(`/support/${ticketId}`);
    }
  };

  if (loading) return <div className="sup-state">Loading...</div>;

  return (
    <div className="sup-page">
      <div className="sup-header">
        <div>
          <h1>SUPPORT CENTER</h1>
          <p>{isAdmin ? 'Manage all user tickets' : 'Get help with any issue'}</p>
        </div>
        {!isAdmin && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + New Ticket
          </button>
        )}
      </div>

      {tickets.length === 0 ? (
        <div className="sup-state">
          No tickets yet. Create one if you need help.
        </div>
      ) : (
        <div className="sup-list">
          {tickets.map((t) => (
            <div
              key={t._id}
              className="sup-card"
              onClick={() => handleCardClick(t._id)}
            >
              <div className="sup-card-top">
                <span className={`sup-status sup-status-${t.status.toLowerCase()}`}>
                  {t.status.replace('_', ' ')}
                </span>
                <span className={`sup-priority sup-priority-${t.priority.toLowerCase()}`}>
                  {t.priority}
                </span>
                <span className="sup-id">#{t.ticketId}</span>
              </div>

              <h3>{t.subject}</h3>

              <div className="sup-meta">
                <span>
                  {CATEGORIES.find((c) => c.value === t.category)?.icon || '🎫'}{' '}
                  {t.category.replace('_', ' ')}
                </span>
                {isAdmin && t.userId?.name && <span>· {t.userId.name}</span>}
              </div>

              <div className="sup-footer">
                <span>{t.conversation?.length || 0} replies</span>
                <span>{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal (only for users) */}
      {showModal && !isAdmin && (
        <div
          className="modal-overlay"
          onClick={() => !saving && setShowModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>NEW SUPPORT TICKET</h2>

            {error && <div className="sup-error">{error}</div>}

            <form onSubmit={handleSubmit} className="sup-form">
              <div className="form-group">
                <label>Subject *</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                  placeholder="Brief title of your issue"
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                  rows="6"
                  placeholder="Describe your issue in detail..."
                  maxLength={5000}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;