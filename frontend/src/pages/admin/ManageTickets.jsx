import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import './AdminDashboard.css';

const CATEGORIES = {
  ACCOUNT_ISSUE: '👤',
  PAYMENT_ISSUE: '💳',
  PROJECT_ISSUE: '📁',
  TECHNICAL_ISSUE: '🔧',
  COMPLAINT: '⚠️',
  FEEDBACK: '💬',
  GENERAL_QUERY: '❓',
  FEATURE_REQUEST: '✨',
  BUG_REPORT: '🐛',
};

const ManageTickets = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/admin/support?${params.toString()}`);
      setTickets(data.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  useEffect(() => {
    if (!socket) return;
    const onChanged = () => load();
    socket.on('newNotification', onChanged);
    return () => socket.off('newNotification', onChanged);
  }, [socket]);

  if (loading) return <div className="ad-state">Loading...</div>;

  return (
    <div className="ad-page">
      <Link to="/admin" className="btn-back">← Back to Admin</Link>

      <div className="ad-header">
        <h1>SUPPORT TICKETS</h1>
        <p>{tickets.length} tickets</p>
      </div>

      <div className="ad-filters" style={{ gridTemplateColumns: '1fr auto' }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <button onClick={load}>Refresh</button>
      </div>

      <div className="ad-users-table">
        {tickets.length === 0 ? (
          <div className="ad-state">No tickets found</div>
        ) : (
          tickets.map((t) => (
            <div
              key={t._id}
              className="ad-user-row"
              onClick={() => navigate(`/admin/support/${t._id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="ad-user-avatar">
                {CATEGORIES[t.category] || '🎫'}
              </div>
              <div className="ad-user-info">
                <strong>{t.subject}</strong>
                <span>
                  {t.userId?.name} · {t.category.replace('_', ' ')} · #{t.ticketId}
                </span>
              </div>
              <span
                className={`ad-role ad-role-${
                  t.priority === 'URGENT' ? 'admin' : 'client'
                }`}
              >
                {t.priority}
              </span>
              <span
                className={`ad-role ad-role-${
                  t.status === 'RESOLVED' || t.status === 'CLOSED'
                    ? 'freelancer'
                    : 'client'
                }`}
              >
                {t.status.replace('_', ' ')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageTickets;