import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, isClient, isFreelancer } = useAuth();
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
    const interval = setInterval(fetchCounts, 3000);
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
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-text">FREELANCER MARKETPLACE</span>
        </Link>

        {/* Main links */}
        <ul className="navbar-links">
          <li><Link to="/projects">Explore</Link></li>

          {isAuthenticated && isClient && (
            <>
              <li><Link to="/projects/my">My Projects</Link></li>
              <li><Link to="/projects/create">Post Project</Link></li>
            </>
          )}

          {isAuthenticated && isFreelancer && (
            <li><Link to="/proposals/my">My Proposals</Link></li>
          )}

          {isAuthenticated && (
            <>
              <li><Link to="/contracts">Contracts</Link></li>
              <li><Link to="/payments">Payments</Link></li>
            </>
          )}
        </ul>

        {/* Right side — icons + user actions */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              {/* Message icon */}
              <Link to="/messages" className="nav-icon-btn" title="Messages">
                💬
                {unreadMessages > 0 && (
                  <span className="nav-badge">{unreadMessages}</span>
                )}
              </Link>

              {/* Notification icon — only bell */}
              <Link to="/notifications" className="nav-icon-btn" title="Notifications">
                🔔
                {hasUnreadNotifs && <span className="bell-dot" />}
              </Link>

              {/* User dropdown menu */}
              <div className="nav-user">
                <span className="navbar-user">
                  Hi, {user?.name?.split(' ')[0]}
                </span>
                <div className="nav-user-menu">
                  <Link to="/dashboard">Dashboard</Link>
                  <Link to="/profile">Profile</Link>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              </div>
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