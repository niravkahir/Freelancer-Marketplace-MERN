import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminDashboard.css';

const ManageProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get('/admin/projects');
      setProjects(data.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete project "${title}"?`)) return;
    setActionLoading(id);
    try {
      await api.delete(`/admin/projects/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="ad-state">Loading...</div>;

  return (
    <div className="ad-page">
      <Link to="/admin" className="btn-back">← Back to Admin</Link>

      <div className="ad-header">
        <h1>MANAGE PROJECTS</h1>
        <p>{projects.length} projects total</p>
      </div>

      <div className="ad-users-table">
        {projects.length === 0 ? (
          <div className="ad-state">No projects found</div>
        ) : (
          projects.map((p) => (
            <div key={p._id} className="ad-user-row">
              <div className="ad-user-info" style={{ flex: 1 }}>
                <strong>{p.title}</strong>
                <span>
                  By {p.clientId?.name} · ₹{p.budget?.toLocaleString()} · {p.category}
                </span>
              </div>
              <span className={`ad-role ad-role-${p.status === 'Open' ? 'client' : 'freelancer'}`}>
                {p.status}
              </span>
              <div className="ad-user-actions">
                <button
                  className="ad-btn-warn"
                  onClick={() => navigate(`/projects/${p._id}`)}
                >
                  View
                </button>
                <button
                  className="ad-btn-danger"
                  onClick={() => handleDelete(p._id, p.title)}
                  disabled={actionLoading === p._id}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageProjects;