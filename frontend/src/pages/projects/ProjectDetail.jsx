import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isClient, isFreelancer, user } = useAuth();
  const { socket } = useSocket();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myProposal, setMyProposal] = useState(null);

  const [proposal, setProposal] = useState({
    coverLetter: '',
    bidAmount: '',
    estimatedTime: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [proposalMsg, setProposalMsg] = useState('');
  const [proposalErr, setProposalErr] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data.project);

      if (isFreelancer) {
        try {
          const myRes = await api.get('/proposals/my');
          const mine = (myRes.data.proposals || []).find(
            (p) => p.projectId?._id === data.project._id
          );
          if (mine) setMyProposal(mine);
        } catch (e) {}
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Project not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, isFreelancer]);

  // ✅ Real-time updates
  useEffect(() => {
    if (!socket || !project) return;

    const onChanged = async (data) => {
      if (
        data.projectId?.toString() === project._id?.toString() ||
        !data.projectId
      ) {
        try {
          const { data: fresh } = await api.get(`/projects/${id}`);
          setProject(fresh.project);

          if (isFreelancer) {
            const myRes = await api.get('/proposals/my');
            const mine = (myRes.data.proposals || []).find(
              (p) => p.projectId?._id === fresh.project._id
            );
            setMyProposal(mine || null);
          }
        } catch (e) {}
      }
    };

    socket.on('proposalsChanged', onChanged);
    socket.on('projectChanged', onChanged);

    return () => {
      socket.off('proposalsChanged', onChanged);
      socket.off('projectChanged', onChanged);
    };
  }, [socket, project, id, isFreelancer]);

  const handleProposalChange = (e) =>
    setProposal({ ...proposal, [e.target.name]: e.target.value });

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    setProposalErr('');
    setProposalMsg('');
    setSubmitting(true);

    try {
      await api.post('/proposals', {
        projectId: project._id,
        coverLetter: proposal.coverLetter,
        bidAmount: Number(proposal.bidAmount),
        estimatedTime: Number(proposal.estimatedTime),
      });
      setProposalMsg('Proposal submitted successfully!');

      const myRes = await api.get('/proposals/my');
      const mine = (myRes.data.proposals || []).find(
        (p) => p.projectId?._id === project._id
      );
      if (mine) setMyProposal(mine);
      setProposal({ coverLetter: '', bidAmount: '', estimatedTime: '' });
    } catch (err) {
      setProposalErr(err.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="pd-state">Loading...</div>;
  if (error) return <div className="pd-state error">{error}</div>;
  if (!project) return null;

  const isOwner = user?.id === project.clientId?._id || user?._id === project.clientId?._id;
  const isExpired = new Date(project.deadline) < new Date();
  const canApply =
    isFreelancer && !isOwner && project.status === 'Open' && !isExpired && !myProposal;

  return (
    <div className="pd-page">
      <div className="pd-header">
        <div className="pd-header-top">
          <span className="pd-status">{project.status}</span>
          <span className="pd-category">{project.category}</span>
          {isExpired && <span className="pd-expired-tag">EXPIRED</span>}
        </div>
        <h1>{project.title}</h1>
        <div className="pd-meta">
          <span>Posted by {project.clientId?.name || 'Client'}</span>
          <span>·</span>
          <span>₹{project.budget?.toLocaleString()}</span>
          <span>·</span>
          <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="pd-grid">
        <div className="pd-main">
          <div className="pd-card">
            <h3>PROJECT DESCRIPTION</h3>
            <p className="pd-desc">{project.description}</p>
          </div>

          <div className="pd-card">
            <h3>REQUIRED SKILLS</h3>
            <div className="pd-skills">
              {project.skillsRequired?.map((s, i) => (
                <span key={i} className="skill-chip">{s}</span>
              ))}
            </div>
          </div>

          <div className="pd-card">
            <h3>DETAILS</h3>
            <p><strong>Experience Level:</strong> {project.experienceLevel}</p>
            <p><strong>Project Type:</strong> {project.projectType}</p>
            <p><strong>Sub-Category:</strong> {project.subCategory || '—'}</p>
            <p><strong>Proposals:</strong> {project.proposalsCount || 0}</p>
            <p><strong>Posted:</strong> {new Date(project.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="pd-sidebar">
          {isOwner && (
            <div className="pd-card pd-owner">
              <h3>YOUR PROJECT</h3>
              <p>You posted this project.</p>

              <button
                className="btn-primary"
                onClick={() => navigate(`/projects/${project._id}/proposals`)}
              >
                View Proposals ({project.proposalsCount || 0})
              </button>

              {project.status === 'Open' && !isExpired && (
                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/projects/${project._id}/edit`)}
                  style={{ marginTop: '0.5rem' }}
                >
                  Edit Project
                </button>
              )}
            </div>
          )}

          {isOwner && project.status === 'In Progress' && (
            <div className="pd-card">
              <h3>PROJECT IN PROGRESS</h3>
              <p>You've hired a freelancer. Edit is disabled while the project is active.</p>
            </div>
          )}

          {!isAuthenticated && (
            <div className="pd-card">
              <h3>WANT TO APPLY?</h3>
              <p>Log in as a freelancer to submit a proposal.</p>
              <button className="btn-primary" onClick={() => navigate('/login')}>Login</button>
            </div>
          )}

          {isAuthenticated && isClient && !isOwner && (
            <div className="pd-card">
              <h3>CLIENT ACCOUNT</h3>
              <p>Only freelancers can apply to projects.</p>
            </div>
          )}

          {myProposal && (
            <div className="pd-card">
              <h3>YOUR PROPOSAL STATUS</h3>

              <div className={`pd-status-badge pd-status-${myProposal.status.toLowerCase()}`}>
                {myProposal.status === 'Accepted' && '✓ ACCEPTED'}
                {myProposal.status === 'Rejected' && '✕ REJECTED'}
                {myProposal.status === 'Pending' && '⏳ PENDING'}
                {myProposal.status === 'Withdrawn' && '— WITHDRAWN'}
                {myProposal.status === 'Interviewing' && '💬 INTERVIEWING'}
              </div>

              <p className="pd-status-msg">
                {myProposal.status === 'Accepted' &&
                  '🎉 Congratulations! You were hired for this project.'}
                {myProposal.status === 'Rejected' &&
                  'This proposal was rejected by the client.'}
                {myProposal.status === 'Pending' &&
                  'Your proposal is being reviewed by the client.'}
                {myProposal.status === 'Withdrawn' &&
                  'You withdrew this proposal.'}
                {myProposal.status === 'Interviewing' &&
                  'The client is interested and reviewing your proposal.'}
              </p>

              <div className="pd-proposal-details">
                <p><strong>Bid:</strong> ₹{myProposal.bidAmount?.toLocaleString()}</p>
                <p><strong>Delivery:</strong> {myProposal.estimatedTime} days</p>
              </div>

              <button className="btn-primary" onClick={() => navigate('/proposals/my')}>
                View My Proposal
              </button>
            </div>
          )}

          {canApply && (
            <div className="pd-card">
              <h3>SUBMIT A PROPOSAL</h3>

              {proposalMsg && <div className="pd-success">{proposalMsg}</div>}
              {proposalErr && <div className="pd-error">{proposalErr}</div>}

              <form onSubmit={handleProposalSubmit} className="pd-form">
                <div className="form-group">
                  <label>Cover Letter *</label>
                  <textarea
                    name="coverLetter"
                    rows="5"
                    value={proposal.coverLetter}
                    onChange={handleProposalChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Bid Amount (₹) *</label>
                  <input
                    name="bidAmount"
                    type="number"
                    min="0"
                    value={proposal.bidAmount}
                    onChange={handleProposalChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Time (days) *</label>
                  <input
                    name="estimatedTime"
                    type="number"
                    min="1"
                    value={proposal.estimatedTime}
                    onChange={handleProposalChange}
                    required
                  />
                </div>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </form>
            </div>
          )}

          {isFreelancer && !myProposal && isExpired && (
            <div className="pd-card">
              <h3>PROJECT EXPIRED</h3>
              <p>This project's deadline has passed. No new proposals accepted.</p>
            </div>
          )}

          {isFreelancer && !myProposal && !isExpired && project.status !== 'Open' && (
            <div className="pd-card">
              <h3>NOT ACCEPTING PROPOSALS</h3>
              <p>This project is currently {project.status.toLowerCase()}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;