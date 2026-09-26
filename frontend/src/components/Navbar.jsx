import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, isClient } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadMessages(0);
      setHasUnreadNotifs(false);
      return;
    }

    const fetchCounts = async () => {
      try {
        const [msgRes, notifRes] = await Promise.all([
          api.get('/messages/unread-count'),
          api.get('/notifications/unread-count'),
        ]);
        setUnreadMessages(msgRes.data.count || 0);
        setHasUnreadNotifs((notifRes.data.unreadCount || 0) > 0);
      } catch (e) {}
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;

    const refresh = async () => {
      try {
        const [msgRes, notifRes] = await Promise.all([
          api.get('/messages/unread-count'),
          api.get('/notifications/unread-count'),
        ]);
        setUnreadMessages(msgRes.data.count || 0);
        setHasUnreadNotifs((notifRes.data.unreadCount || 0) > 0);
      } catch (e) {}
    };

    socket.on('refreshUnread', refresh);
    socket.on('unreadUpdate', refresh);
    socket.on('newNotification', refresh);

    return () => {
      socket.off('refreshUnread', refresh);
      socket.off('unreadUpdate', refresh);
      socket.off('newNotification', refresh);
    };
  }, [socket]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-text">FREELANCER MARKETPLACE</span>
        </Link>

        <ul className="navbar-links">
          <li><Link to="/projects">Explore</Link></li>
          {isAuthenticated && isClient && (
            <>
              <li><Link to="/projects/my">My Projects</Link></li>
              <li><Link to="/projects/create">Post Project</Link></li>
            </>
          )}
          {isAuthenticated && (
            <>
              <li>
                <Link to="/messages" className="nav-messages-link">
                  💬 Messages
                  {unreadMessages > 0 && (
                    <span className="nav-badge">{unreadMessages}</span>
                  )}
                </Link>
              </li>
              <li>
                <Link to="/notifications" className="nav-bell">
                  🔔
                  {hasUnreadNotifs && <span className="bell-dot" />}
                </Link>
              </li>
            </>
          )}
        </ul>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <span className="navbar-user">Hi, {user?.name?.split(' ')[0]}</span>
              <Link to="/dashboard" className="btn-outline">Dashboard</Link>
              <Link to="/profile" className="btn-outline">Profile</Link>
              <button onClick={handleLogout} className="btn-solid">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline">Login</Link>
              <Link to="/register" className="btn-solid">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;