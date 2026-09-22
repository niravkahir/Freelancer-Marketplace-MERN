import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './ProjectProposals.css';

const ProjectProposals = () => {
  const { projectId } = useParams();   // this is ObjectId of project
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [projRes, propRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/proposals/project/${projectId}`),
      ]);
      setProject(projRes.data.project);
      setProposals(propRes.data.proposals || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const handleAccept = async (id) => {
    if (!window.confirm('Accept this proposal? Other proposals will remain.')) return;
    try {
      await api.put(`/proposals/${id}/accept`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this proposal?')) return;
    try {
      await api.put(`/proposals/${id}/reject`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  if (loading) return <div className="pp-state">Loading...</div>;
  if (error) return <div className="pp-state error">{error}</div>;

  return (
    <div className="pp-page">
      <div className="pp-header">
        <button className="btn-back" onClick={() => navigate(`/projects/${project?.projectId}`)}>
          ← Back to Project
        </button>
        <h1>PROPOSALS</h1>
        <p>
          {project?.title} · {proposals.length} application
          {proposals.length !== 1 ? 's' : ''}
        </p>
      </div>

      {proposals.length === 0 ? (
        <div className="pp-state">No proposals yet.</div>
      ) : (
        <div className="pp-list">
          {proposals.map((p) => (
            <div key={p._id} className="pp-card">
              <div className="pp-card-top">
                <div className="pp-freelancer">
                  <div className="pp-avatar">
                    {p.freelancerId?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3>{p.freelancerId?.name || 'Unknown'}</h3>
                    <p>{p.freelancerId?.email}</p>
                  </div>
                </div>
                <span className={`status-badge status-${p.status.toLowerCase()}`}>
                  {p.status}
                </span>
              </div>

              <div className="pp-bid">
                <div>
                  <span className="label">BID AMOUNT</span>
                  <span className="value">₹{p.bidAmount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="label">DELIVERY</span>
                  <span className="value">{p.estimatedTime} days</span>
                </div>
              </div>

              <div className="pp-cover">
                <h4>Cover Letter</h4>
                <p>{p.coverLetter}</p>
              </div>

              {p.status === 'Pending' && (
                <div className="pp-actions">
                  <button className="btn-accept" onClick={() => handleAccept(p._id)}>
                    ✓ Accept
                  </button>
                  <button className="btn-reject" onClick={() => handleReject(p._id)}>
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectProposals;