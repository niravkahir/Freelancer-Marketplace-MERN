import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './MyProjects.css';

const MyProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/users/my-projects');
        setProjects(data.projects || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="mp-state">Loading...</div>;

  return (
    <div className="mp-page">
      <div className="mp-header">
        <div>
          <h1>MY PROJECTS</h1>
          <p>Manage your posted projects and review proposals</p>
        </div>
        <Link to="/projects/create" className="btn-primary">+ Post a Project</Link>
      </div>

      {projects.length === 0 ? (
        <div className="mp-state">
          You haven't posted any projects yet.{' '}
          <Link to="/projects/create">Post your first →</Link>
        </div>
      ) : (
        <div className="mp-list">
          {projects.map((p) => {
            const isExpired = new Date(p.deadline) < new Date();
            const canEdit = p.status === 'Open' && !isExpired;

            return (
              <div key={p._id} className="mp-card">
                <div className="mp-card-top">
                  <span className="mp-status">{p.status}</span>
                  {isExpired && <span className="mp-expired">EXPIRED</span>}
                </div>

                <span className="mp-category">{p.category}</span>

                <h3>{p.title}</h3>

                <div className="mp-meta">
                  <span>₹{p.budget?.toLocaleString()}</span>
                  <span>·</span>
                  <span>Due {new Date(p.deadline).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{p.proposalsCount || 0} proposal(s)</span>
                </div>

                <div className="mp-actions">
                  {/* ✅ Use _id everywhere */}
                  <button
                    className="btn-primary"
                    onClick={() => navigate(`/projects/${p._id}/proposals`)}
                  >
                    View Proposals ({p.proposalsCount || 0})
                  </button>

                  {canEdit && (
                    <button
                      className="btn-outline"
                      onClick={() => navigate(`/projects/${p._id}/edit`)}
                    >
                      Edit
                    </button>
                  )}

                  <button
                    className="btn-outline"
                    onClick={() => navigate(`/projects/${p._id}`)}
                  >
                    View Public
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyProjects;