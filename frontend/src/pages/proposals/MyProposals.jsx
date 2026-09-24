import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './MyProposals.css';

const MyProposals = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({
    coverLetter: '',
    bidAmount: '',
    estimatedTime: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/proposals/my');
      setProposals(data.proposals || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (p) => {
    setEditing(p);
    setEditForm({
      coverLetter: p.coverLetter,
      bidAmount: p.bidAmount,
      estimatedTime: p.estimatedTime,
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/proposals/${editing._id}`, {
        coverLetter: editForm.coverLetter,
        bidAmount: Number(editForm.bidAmount),
        estimatedTime: Number(editForm.estimatedTime),
      });
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm('Withdraw this proposal?')) return;
    try {
      await api.put(`/proposals/${id}/withdraw`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw');
    }
  };

  if (loading) return <div className="proposals-state">Loading...</div>;
  if (error) return <div className="proposals-state error">{error}</div>;

  return (
    <div className="proposals-page">
      <div className="proposals-header">
        <h1>MY PROPOSALS</h1>
        <p>Track all your submitted applications</p>
      </div>

      {proposals.length === 0 ? (
        <div className="proposals-state">
          You haven't submitted any proposals yet.{' '}
          <Link to="/projects">Browse projects →</Link>
        </div>
      ) : (
        <div className="proposals-list">
          {proposals.map((p) => (
            <div key={p._id} className="proposal-card">
              <div className="proposal-card-top">
                <span className={`status-badge status-${p.status.toLowerCase()}`}>
                  {p.status}
                </span>
                <span className="proposal-id">#{p.proposalId}</span>
              </div>

              <h3>{p.projectId?.title || 'Project removed'}</h3>

              {/* ✅ Result banner */}
              {p.status === 'Accepted' && (
                <div className="proposal-result proposal-result-accepted">
                  🎉 Congratulations! Your proposal has been accepted.
                </div>
              )}
              {p.status === 'Rejected' && (
                <div className="proposal-result proposal-result-rejected">
                  ✕ Your proposal was rejected by the client.
                </div>
              )}
              {p.status === 'Withdrawn' && (
                <div className="proposal-result proposal-result-withdrawn">
                  — You withdrew this proposal.
                </div>
              )}

              <div className="proposal-info">
                <p><strong>Bid:</strong> ₹{p.bidAmount?.toLocaleString()}</p>
                <p><strong>Days:</strong> {p.estimatedTime}</p>
              </div>

              <p className="proposal-cover">
                {p.coverLetter?.length > 150
                  ? p.coverLetter.slice(0, 150) + '...'
                  : p.coverLetter}
              </p>

              <div className="proposal-actions">
                {p.projectId && (
                  <Link to={`/projects/${p.projectId._id}`} className="btn-outline">
                    View Project
                  </Link>
                )}

                {(p.status === 'Pending' || p.status === 'Interviewing') && (
                  <>
                    <button className="btn-outline" onClick={() => openEdit(p)}>
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => handleWithdraw(p._id)}>
                      Withdraw
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>EDIT PROPOSAL</h2>
            <form onSubmit={handleEditSave} className="modal-form">
              <div className="form-group">
                <label>Cover Letter</label>
                <textarea
                  rows="5"
                  value={editForm.coverLetter}
                  onChange={(e) => setEditForm({ ...editForm, coverLetter: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Bid Amount (₹)</label>
                <input
                  type="number"
                  value={editForm.bidAmount}
                  onChange={(e) => setEditForm({ ...editForm, bidAmount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Estimated Time (days)</label>
                <input
                  type="number"
                  value={editForm.estimatedTime}
                  onChange={(e) => setEditForm({ ...editForm, estimatedTime: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProposals;