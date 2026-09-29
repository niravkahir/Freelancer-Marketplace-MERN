import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolution, setResolution] = useState('');
  const [inProgressMsg, setInProgressMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/support/${id}`);
      setTicket(data.ticket);
      setResolution(data.ticket.resolution || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleMarkInProgress = async () => {
    if (!window.confirm('Mark this ticket as In Progress?')) return;
    setSaving(true);
    try {
      await api.put(`/admin/support/${id}/in-progress`, {
        message: inProgressMsg.trim(),
      });
      setInProgressMsg('');
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) return alert('Please enter a resolution');
    if (!window.confirm('Mark this ticket as resolved?')) return;

    setSaving(true);
    try {
      await api.put(`/admin/support/${id}/resolve`, {
        resolution: resolution.trim(),
      });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="ad-state">Loading...</div>;
  if (error)
    return (
      <div className="ad-state" style={{ color: '#ff6b6b' }}>
        {error}
      </div>
    );
  if (!ticket) return null;

  const isResolved = ['RESOLVED', 'CLOSED'].includes(ticket.status);
  const isInProgress = ticket.status === 'IN_PROGRESS';

  return (
    <div className="ad-page">
      <button
        className="btn-back"
        onClick={() => navigate('/admin/support')}
      >
        ← Back to Tickets
      </button>

      <div className="ad-header">
        <div
          style={{
            display: 'flex',
            gap: '0.6rem',
            marginBottom: '1rem',
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          <span
            className={`ad-role ad-role-${
              isResolved ? 'freelancer' : 'client'
            }`}
          >
            {ticket.status.replace('_', ' ')}
          </span>
          <span
            className={`ad-role ad-role-${
              ticket.priority === 'URGENT' ? 'admin' : 'client'
            }`}
          >
            {ticket.priority}
          </span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
            #{ticket.ticketId}
          </span>
        </div>
        <h1>{ticket.subject}</h1>
        <p>
          {ticket.category.replace('_', ' ')} · From {ticket.userId?.name} (
          {ticket.userId?.email})
        </p>
      </div>

      {/* Original Description */}
      <div className="ad-card" style={{ marginBottom: '1.5rem' }}>
        <h3>DESCRIPTION</h3>
        <p
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.92rem',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}
        >
          {ticket.description}
        </p>
      </div>

      {/* Conversation Thread (replies) */}
      {ticket.conversation?.length > 1 && (
        <div className="ad-card" style={{ marginBottom: '1.5rem' }}>
          <h3>CONVERSATION</h3>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}
          >
            {ticket.conversation.slice(1).map((c, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(212, 175, 55, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '5px',
                  padding: '0.9rem 1.1rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--gold)',
                    marginBottom: '0.3rem',
                  }}
                >
                  🛡️ Admin · {new Date(c.sentAt).toLocaleString()}
                </div>
                <p
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                  }}
                >
                  {c.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===========================
          ACTION PANELS
          =========================== */}

      {isResolved ? (
        <div className="ad-card">
          <h3>RESOLUTION</h3>
          <p
            style={{
              color: '#4ade80',
              fontSize: '0.92rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {ticket.resolution || 'Marked as resolved.'}
          </p>
        </div>
      ) : (
        <>
          {/* ✅ MARK AS IN PROGRESS — only when ticket is OPEN */}
          {!isInProgress && (
            <div className="ad-card" style={{ marginBottom: '1.5rem' }}>
              <h3>MARK AS IN PROGRESS</h3>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                Let the user know you're reviewing their issue.
              </p>
              <textarea
                value={inProgressMsg}
                onChange={(e) => setInProgressMsg(e.target.value)}
                rows="3"
                placeholder="Optional message to user (e.g., 'We are investigating this now.')"
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  padding: '0.9rem 1rem',
                  fontSize: '0.9rem',
                  borderRadius: '3px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '1rem',
                }}
              />
              <button
                onClick={handleMarkInProgress}
                disabled={saving}
                style={{
                  background: 'transparent',
                  color: '#60a5fa',
                  border: '1px solid rgba(96, 165, 250, 0.5)',
                  padding: '0.8rem 1.6rem',
                  fontSize: '0.8rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                {saving ? 'Updating...' : '💬 Mark as In Progress'}
              </button>
            </div>
          )}

          {/* ✅ IN PROGRESS banner */}
          {isInProgress && (
            <div
              className="ad-card"
              style={{
                marginBottom: '1.5rem',
                borderColor: 'rgba(96, 165, 250, 0.4)',
              }}
            >
              <h3>IN PROGRESS</h3>
              <p style={{ color: '#60a5fa', fontSize: '0.9rem' }}>
                ✅ You've marked this ticket as being reviewed. User has been
                notified.
              </p>
            </div>
          )}

          {/* ✅ RESOLUTION PANEL */}
          <div className="ad-card">
            <h3>ADD RESOLUTION</h3>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows="5"
              placeholder="Describe how this issue was resolved..."
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                padding: '0.9rem 1rem',
                fontSize: '0.9rem',
                borderRadius: '3px',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '1rem',
              }}
            />
            <button
              onClick={handleResolve}
              disabled={saving}
              style={{
                background: 'var(--gold)',
                color: 'var(--bg-primary)',
                border: 'none',
                padding: '0.8rem 1.6rem',
                fontSize: '0.8rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              {saving ? 'Resolving...' : '✅ Mark as Resolved'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTicketDetail;