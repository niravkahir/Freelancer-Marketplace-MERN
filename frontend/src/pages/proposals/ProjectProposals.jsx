import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import './ProjectProposals.css';

const ProjectProposals = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [action, setAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => { load(); }, [projectId]);

  // ✅ Real-time updates
  useEffect(() => {
    if (!socket) return;

    const onProposalsChanged = async (data) => {
      if (data.projectId?.toString() === projectId?.toString() || !data.projectId) {
        await load();
      }
    };

    socket.on('proposalsChanged', onProposalsChanged);

    return () => {
      socket.off('proposalsChanged', onProposalsChanged);
    };
  }, [socket, projectId]);

  const confirmAction = async () => {
    if (!action) return;
    setActionLoading(true);
    try {
      await api.put(`/proposals/${action.proposalId}/${action.type}`);
      setAction(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openChat = async (freelancerId) => {
    try {
      const { data } = await api.post('/conversations', {
        otherUserId: freelancerId,
        projectId: project._id,
      });
      navigate(`/messages/${data.conversation._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to open chat');
    }
  };

  const openCreateContract = async (proposalId) => {
    try {
      const { data } = await api.get('/contracts');
      const existing = (data.contracts || []).find(
        (c) => c.proposalId === proposalId || c.proposalId?._id === proposalId
      );

      if (existing) {
        navigate(`/contracts/${existing._id}`);
      } else {
        navigate(`/contracts/create/${proposalId}`);
      }
    } catch (err) {
      navigate(`/contracts/create/${proposalId}`);
    }
  };

  if (loading) return <div className="pp-state">Loading...</div>;
  if (error) return <div className="pp-state error">{error}</div>;

  const goBack = () => {
    if (project?._id) {
      navigate(`/projects/${project._id}`);
    } else {
      navigate('/projects/my');
    }
  };

  return (
    <div className="pp-page">
      <div className="pp-header">
        <button className="btn-back" onClick={goBack}>
          ← Back to Project
        </button>
        <h1>PROPOSALS</h1>
        <p>{project?.title} · {proposals.length} application{proposals.length !== 1 ? 's' : ''}</p>
      </div>

      {proposals.length === 0 ? (
        <div className="pp-state">No proposals yet.</div>
      ) : (
        <div className="pp-list">
          {proposals.map((p) => (
            <div key={p._id} className="pp-card">
              {p.status === 'Accepted' && (
                <div className="pp-result pp-result-accepted">
                  ✓ You accepted this proposal. This freelancer has been hired.
                  <button
                    className="btn-primary"
                    style={{ marginTop: '0.8rem', display: 'block', width: '100%' }}
                    onClick={() => openCreateContract(p._id)}
                  >
                    📜 Create Contract
                  </button>
                </div>
              )}
              {p.status === 'Rejected' && (
                <div className="pp-result pp-result-rejected">
                  ✕ This proposal was rejected.
                </div>
              )}
              {p.status === 'Withdrawn' && (
                <div className="pp-result pp-result-withdrawn">
                  — Freelancer withdrew this proposal.
                </div>
              )}

              <div className="pp-card-top">
                <Link
                  to={`/users/${p.freelancerId?._id}`}
                  className="pp-freelancer pp-freelancer-link"
                >
                  <div className="pp-avatar">
                    {p.freelancerId?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3>{p.freelancerId?.name || 'Unknown'}</h3>
                    <p>{p.freelancerId?.email}</p>
                    <span className="pp-view-profile">View Profile →</span>
                  </div>
                </Link>
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
                  <button
                    className="btn-accept"
                    onClick={() => setAction({ type: 'accept', proposalId: p._id, name: p.freelancerId?.name })}
                  >
                    ✓ Accept
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => setAction({ type: 'reject', proposalId: p._id, name: p.freelancerId?.name })}
                  >
                    ✕ Reject
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => openChat(p.freelancerId._id)}
                  >
                    💬 Message
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {action && (
        <div className="modal-overlay" onClick={() => !actionLoading && setAction(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{action.type === 'accept' ? 'ACCEPT PROPOSAL?' : 'REJECT PROPOSAL?'}</h2>
            <p className="modal-body">
              {action.type === 'accept' ? (
                <>
                  Accept <strong>{action.name}</strong>'s proposal?
                  <br />
                  <span className="modal-warn">
                    All other pending proposals for this project will be automatically rejected.
                  </span>
                </>
              ) : (
                <>Reject <strong>{action.name}</strong>'s proposal?</>
              )}
            </p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setAction(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={action.type === 'accept' ? 'btn-save' : 'btn-danger-solid'}
                onClick={confirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : action.type === 'accept' ? 'Yes, Accept' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectProposals;