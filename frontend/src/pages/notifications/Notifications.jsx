import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ✅ Listen for new notifications in real-time
  useEffect(() => {
    if (!socket) return;

    const onNewNotification = async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (e) {}
    };

    socket.on('newNotification', onNewNotification);

    return () => {
      socket.off('newNotification', onNewNotification);
    };
  }, [socket]);

  const handleClick = async (n) => {
    if (!n.isRead) {
      try {
        await api.put(`/notifications/${n._id}/read`);
        setNotifications((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {}
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (e) {}
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete all notifications?')) return;
    try {
      await api.delete('/notifications/delete-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (e) {}
  };

  if (loading) return <div className="notif-state">Loading...</div>;

  return (
    <div className="notif-page">
      <div className="notif-header">
        <div>
          <h1>NOTIFICATIONS</h1>
          <p>{unreadCount} unread</p>
        </div>
        <div className="notif-header-actions">
          {unreadCount > 0 && (
            <button className="btn-outline" onClick={handleMarkAllRead}>
              Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button className="btn-danger" onClick={handleDeleteAll}>
              Delete All
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="notif-state">No notifications yet.</div>
      ) : (
        <div className="notif-list">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`notif-item ${!n.isRead ? 'unread' : ''}`}
              onClick={() => handleClick(n)}
            >
              <div className="notif-icon">
                {n.type === 'PROPOSAL_SUBMITTED' && '📄'}
                {n.type === 'PROPOSAL_ACCEPTED' && '🎉'}
                {n.type === 'PROPOSAL_REJECTED' && '✕'}
                {n.type === 'MESSAGE_RECEIVED' && '💬'}
                {n.type === 'PAYMENT_RECEIVED' && '💰'}
                {n.type === 'PROJECT_COMPLETED' && '✅'}
                {n.type === 'HIRING_COMPLETED' && '🤝'}
                {!['PROPOSAL_SUBMITTED','PROPOSAL_ACCEPTED','PROPOSAL_REJECTED',
                   'MESSAGE_RECEIVED','PAYMENT_RECEIVED','PROJECT_COMPLETED',
                   'HIRING_COMPLETED'].includes(n.type) && '🔔'}
              </div>
              <div className="notif-body">
                <div className="notif-top">
                  <h3>{n.title}</h3>
                  {!n.isRead && <span className="notif-dot" />}
                </div>
                <p>{n.message}</p>
                <span className="notif-time">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                className="notif-delete"
                onClick={(e) => handleDelete(e, n._id)}
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;