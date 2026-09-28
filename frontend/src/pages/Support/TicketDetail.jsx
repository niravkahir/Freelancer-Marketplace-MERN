import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import './TicketDetail.css';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { socket } = useSocket();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/support/${id}`);
      setTicket(data.ticket);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!socket) return;
    const onChanged = (data) => {
      if (data.ticketId?.toString() === id) load();
    };
    socket.on('ticketChanged', onChanged);
    return () => socket.off('ticketChanged', onChanged);
  }, [socket, id]);

  const handleClose = async () => {
    if (!window.confirm('Close this ticket?')) return;
    setActionLoading(true);
    try {
      await api.put(`/support/${id}/close`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="td-state">Loading...</div>;
  if (error) return <div className="td-state error">{error}</div>;
  if (!ticket) return null;

  const isClosed = ['RESOLVED', 'CLOSED'].includes(ticket.status);
  const isOwner = ticket.userId._id === (user?.id || user?._id);

  return (
    <div className="td-page">
      <button className="btn-back" onClick={() => navigate('/support')}>
        ← Back to Tickets
      </button>

      <div className="td-header">
        <div className="td-header-top">
          <span className={`sup-status sup-status-${ticket.status.toLowerCase()}`}>
            {ticket.status.replace('_', ' ')}
          </span>
          <span className={`sup-priority sup-priority-${ticket.priority.toLowerCase()}`}>
            {ticket.priority}
          </span>
          <span className="td-id">#{ticket.ticketId}</span>
        </div>
        <h1>{ticket.subject}</h1>
        <div className="td-meta">
          <span>{ticket.category.replace('_', ' ')}</span>
          <span>·</span>
          <span>Created by {ticket.userId?.name}</span>
          <span>·</span>
          <span>{new Date(ticket.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Original description */}
      <div className="td-thread">
        <div className="td-msg td-msg-mine">
          <div className="td-msg-header">
            <strong>Description</strong>
            <span className="td-msg-time">
              {new Date(ticket.createdAt).toLocaleString()}
            </span>
          </div>
          <p>{ticket.description}</p>
        </div>

        {/* Admin resolution (if provided) */}
        {ticket.resolution && (
          <div className="td-msg td-msg-support">
            <div className="td-msg-header">
              <strong>🛡️ Support Response</strong>
            </div>
            <p>{ticket.resolution}</p>
          </div>
        )}
      </div>

      {/* Status banner */}
      {!isClosed && (
        <div className="td-closed td-pending">
          ⏳ Your ticket is being reviewed by our support team. We'll get back to you soon.
        </div>
      )}

      {isClosed && (
        <div className="td-closed">
          ✅ This ticket is {ticket.status.toLowerCase()}.
        </div>
      )}

      {/* Close button (owner only) */}
      {isOwner && !isClosed && (
        <button
          className="td-close-btn"
          onClick={handleClose}
          disabled={actionLoading}
        >
          {actionLoading ? 'Closing...' : 'Close Ticket'}
        </button>
      )}
    </div>
  );
};

export default TicketDetail;