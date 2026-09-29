import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, isClient, isFreelancer, isAdmin } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);

  const logoPath = isAuthenticated ? '/dashboard' : '/';

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
        <Link to={logoPath} className="navbar-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-text">FREELANCER MARKETPLACE</span>
        </Link>

        <ul className="navbar-links">
          {/* Explore — visible to all */}
          <li><Link to="/projects">Explore</Link></li>

          {/* ✅ ADMIN-ONLY nav */}
          {isAuthenticated && isAdmin && (
            <>
              <li><Link to="/admin">Admin</Link></li>
              <li><Link to="/admin/support">Support</Link></li>
            </>
          )}

          {/* ✅ CLIENT nav */}
          {isAuthenticated && isClient && (
            <>
              <li><Link to="/projects/my">My Projects</Link></li>
              <li><Link to="/projects/create">Post Project</Link></li>
              <li><Link to="/contracts">Contracts</Link></li>
              <li><Link to="/payments">Payments</Link></li>
              <li><Link to="/support">Support</Link></li>
            </>
          )}

          {/* ✅ FREELANCER nav */}
          {isAuthenticated && isFreelancer && (
            <>
              <li><Link to="/proposals/my">My Proposals</Link></li>
              <li><Link to="/contracts">Contracts</Link></li>
              <li><Link to="/payments">Payments</Link></li>
              <li><Link to="/support">Support</Link></li>
            </>
          )}
        </ul>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              {/* Messages icon — hide for admin */}
              {!isAdmin && (
                <Link to="/messages" className="nav-icon-btn" title="Messages">
                  💬
                  {unreadMessages > 0 && (
                    <span className="nav-badge">{unreadMessages}</span>
                  )}
                </Link>
              )}

              {/* Notifications — keep for all */}
              <Link to="/notifications" className="nav-icon-btn" title="Notifications">
                🔔
                {hasUnreadNotifs && <span className="bell-dot" />}
              </Link>

              <div className="nav-user">
                <span className="navbar-user">
                  Hi, {user?.name?.split(' ')[0]}
                </span>
                <div className="nav-user-menu">
                  <Link to="/dashboard">Dashboard</Link>
                  <Link to="/profile">Profile</Link>
                  {isAdmin && <Link to="/admin">Admin Panel</Link>}
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