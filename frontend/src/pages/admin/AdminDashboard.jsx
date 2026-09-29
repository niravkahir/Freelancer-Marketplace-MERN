import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data.stats);
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
    socket.on('newNotification', onChanged);
    socket.on('ticketChanged', onChanged);
    return () => {
      socket.off('newNotification', onChanged);
      socket.off('ticketChanged', onChanged);
    };
  }, [socket]);

  if (loading) return <div className="ad-state">Loading...</div>;
  if (!stats) return null;

  return (
    <div className="ad-page">
      <div className="ad-header">
        <div>
          <h1>ADMIN DASHBOARD</h1>
          <p>Platform overview and controls</p>
        </div>
      </div>

      <div className="ad-stats-grid">
        <div className="ad-stat">
          <span className="ad-stat-label">TOTAL USERS</span>
          <span className="ad-stat-value">{stats.totalUsers}</span>
          <span className="ad-stat-sub">
            {stats.totalClients} clients · {stats.totalFreelancers} freelancers
          </span>
        </div>
        <div className="ad-stat">
          <span className="ad-stat-label">PROJECTS</span>
          <span className="ad-stat-value">{stats.totalProjects}</span>
          <span className="ad-stat-sub">
            {stats.activeProjects} active · {stats.completedProjects} completed
          </span>
        </div>
        <div className="ad-stat">
          <span className="ad-stat-label">CONTRACTS</span>
          <span className="ad-stat-value">{stats.totalContracts}</span>
          <span className="ad-stat-sub">{stats.activeContracts} active</span>
        </div>
        <div className="ad-stat">
          <span className="ad-stat-label">TOTAL REVENUE</span>
          <span className="ad-stat-value">₹{stats.totalRevenue.toLocaleString()}</span>
          <span className="ad-stat-sub">{stats.totalPayments} payments</span>
        </div>
        <div className="ad-stat">
          <span className="ad-stat-label">PENDING TICKETS</span>
          <span className="ad-stat-value">{stats.pendingTickets}</span>
          <span className="ad-stat-sub">Need attention</span>
        </div>
      </div>

      <div className="ad-nav-grid">
        <Link to="/admin/users" className="ad-nav-card">
          <h3>👥 Manage Users</h3>
          <p>View, block, or delete user accounts</p>
        </Link>
        <Link to="/admin/projects" className="ad-nav-card">
          <h3>📁 Manage Projects</h3>
          <p>Review and moderate projects</p>
        </Link>
        <Link to="/admin/support" className="ad-nav-card">
          <h3>🎫 Support Tickets</h3>
          <p>Respond to user issues</p>
        </Link>
      </div>

      <div className="ad-card">
        <h3>RECENT SIGNUPS</h3>
        <div className="ad-users-list">
          {stats.recentUsers?.map((u) => (
            <div key={u._id} className="ad-user-row">
              <div className="ad-user-avatar">
                {u.name?.charAt(0).toUpperCase()}
              </div>
              <div className="ad-user-info">
                <strong>{u.name}</strong>
                <span>{u.email}</span>
              </div>
              <span className={`ad-role ad-role-${u.role.toLowerCase()}`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;