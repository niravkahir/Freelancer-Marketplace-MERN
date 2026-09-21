import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isClient, isFreelancer, user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Proposal form
  const [proposal, setProposal] = useState({
    coverLetter: '',
    bidAmount: '',
    estimatedTime: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [proposalMsg, setProposalMsg] = useState('');
  const [proposalErr, setProposalErr] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/projects/${id}`);
        setProject(data.project);
      } catch (err) {
        setError(err.response?.data?.message || 'Project not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
      setProposal({ coverLetter: '', bidAmount: '', estimatedTime: '' });
    } catch (err) {
      setProposalErr(
        err.response?.data?.message || 'Failed to submit proposal'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="pd-state">Loading...</div>;
  if (error) return <div className="pd-state error">{error}</div>;
  if (!project) return null;

  const isOwner = user?.id === project.clientId?._id;
  const isExpired = new Date(project.deadline) < new Date();
  const canApply =
    isFreelancer && !isOwner && project.status === 'Open' && !isExpired;

  return (
    <div className="pd-page">
      {/* Header */}
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
        {/* Left — Description */}
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
            <p>
              <strong>Posted:</strong>{' '}
              {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Right — Sidebar */}
        <div className="pd-sidebar">
          {isOwner && (
            <div className="pd-card pd-owner">
              <h3>YOUR PROJECT</h3>
              <p>You posted this project.</p>
              <button
                className="btn-primary"
                onClick={() => navigate(`/projects/${project.projectId}/edit`)}
              >
                Edit Project
              </button>
            </div>
          )}

          {!isAuthenticated && (
            <div className="pd-card">
              <h3>WANT TO APPLY?</h3>
              <p>Log in as a freelancer to submit a proposal.</p>
              <button className="btn-primary" onClick={() => navigate('/login')}>
                Login
              </button>
            </div>
          )}

          {isAuthenticated && isClient && !isOwner && (
            <div className="pd-card">
              <h3>CLIENT ACCOUNT</h3>
              <p>Only freelancers can apply to projects.</p>
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
                    placeholder="Explain why you're a great fit..."
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
                    placeholder="45000"
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
                    placeholder="30"
                  />
                </div>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </form>
            </div>
          )}

          {isFreelancer && isExpired && (
            <div className="pd-card">
              <h3>PROJECT EXPIRED</h3>
              <p>This project's deadline has passed. No new proposals accepted.</p>
            </div>
          )}

          {isFreelancer && !isExpired && project.status !== 'Open' && (
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