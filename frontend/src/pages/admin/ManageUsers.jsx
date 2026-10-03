import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminDashboard.css';

const ManageUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);

      const { data } = await api.get(`/admin/users?${params.toString()}`);
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggleBlock = async (e, id) => {
    e.stopPropagation();   // ✅ prevent row click
    setActionLoading(id);
    try {
      await api.put(`/admin/users/${id}/block`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (e, id) => {
    e.stopPropagation();   // ✅ prevent row click
    setActionLoading(id);
    try {
      await api.put(`/admin/users/${id}/verify`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();   // ✅ prevent row click
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      await api.delete(`/admin/users/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRowClick = (id) => {
    navigate(`/users/${id}`);
  };

  if (loading) return <div className="ad-state">Loading...</div>;

  return (
    <div className="ad-page">
      <Link to="/admin" className="btn-back">← Back to Admin</Link>

      <div className="page-header">
        <div>
          <h1>MANAGE USERS</h1>
          <p>{users.length} users · Click any user to view their full profile</p>
        </div>
      </div>

      <div className="ad-filters">
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="CLIENT">Clients</option>
          <option value="FREELANCER">Freelancers</option>
          <option value="ADMIN">Admins</option>
        </select>
        <button onClick={load}>Search</button>
      </div>

      <div className="ad-users-table">
        {users.length === 0 ? (
          <div className="ad-state">No users found</div>
        ) : (
          users.map((u) => (
            <div
              key={u._id}
              className="ad-user-row clickable"
              onClick={() => handleRowClick(u._id)}
            >
              <div className="ad-user-avatar">
                {u.name?.charAt(0).toUpperCase()}
              </div>
              <div className="ad-user-info">
                <strong>
                  {u.name} {u.isBlocked && '🚫'}
                </strong>
                <span>{u.email}</span>
              </div>
              <span className={`ad-role ad-role-${u.role.toLowerCase()}`}>
                {u.role}
              </span>

              {u.role !== 'ADMIN' && (
                <div className="ad-user-actions">
                  {u.role === 'CLIENT' && (
                    <button
                      className={u.isVerified ? 'ad-btn-success' : 'ad-btn-warn'}
                      onClick={(e) => handleVerify(e, u._id)}
                      disabled={actionLoading === u._id}
                    >
                      {u.isVerified ? '✅ Verified' : 'Verify'}
                    </button>
                  )}
                  <button
                    className="ad-btn-warn"
                    onClick={(e) => handleToggleBlock(e, u._id)}
                    disabled={actionLoading === u._id}
                  >
                    {u.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                  <button
                    className="ad-btn-danger"
                    onClick={(e) => handleDelete(e, u._id, u.name)}
                    disabled={actionLoading === u._id}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageUsers;