import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import './ContractDetail.css';

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/contracts/${id}`);
      setContract(data.contract);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // ✅ Real-time refresh when either party signs / completes
  useEffect(() => {
    if (!socket) return;

    const onContractChanged = (data) => {
      if (data.contractId?.toString() === id) {
        load();
      }
    };

    socket.on('contractChanged', onContractChanged);

    return () => {
      socket.off('contractChanged', onContractChanged);
    };
  }, [socket, id]);

  const handleSign = async () => {
    setActionLoading(true);
    try {
      await api.put(`/contracts/${id}/sign`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to sign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Mark this contract as completed?')) return;
    setActionLoading(true);
    try {
      await api.put(`/contracts/${id}/complete`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="cd-state">Loading...</div>;
  if (error) return <div className="cd-state error">{error}</div>;
  if (!contract) return null;

  const myId = user?.id || user?._id;
  const isOwner = contract.clientId._id === myId;
  const mySigned = isOwner ? contract.signedByClient : contract.signedByFreelancer;
  const otherSigned = isOwner ? contract.signedByFreelancer : contract.signedByClient;

  return (
    <div className="cd-page">
      <button className="btn-back" onClick={() => navigate('/contracts')}>
        ← Back to Contracts
      </button>

      <div className="cd-header">
        <div className="cd-header-top">
          <span className={`cd-status cd-status-${contract.status.toLowerCase()}`}>
            {contract.status}
          </span>
          <span className="cd-id">#{contract.contractId}</span>
        </div>
        <h1>{contract.title}</h1>
        <p className="cd-project">📁 {contract.projectId?.title}</p>
      </div>

      <div className="cd-grid">
        <div className="cd-main">
          <div className="cd-card">
            <h3>DESCRIPTION</h3>
            <p>{contract.description}</p>
          </div>

          <div className="cd-card">
            <h3>TERMS & CONDITIONS</h3>
            <p>{contract.terms || 'No additional terms.'}</p>
          </div>

          <div className="cd-card">
            <h3>PARTIES</h3>
            <div className="cd-parties">
              <div className="cd-party">
                <div className="cd-avatar">
                  {contract.clientId.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{contract.clientId.name}</strong>
                  <p>Client</p>
                  <span className={contract.signedByClient ? 'signed' : 'not-signed'}>
                    {contract.signedByClient ? '✅ Signed' : '⏳ Not Signed'}
                  </span>
                </div>
              </div>

              <div className="cd-party">
                <div className="cd-avatar">
                  {contract.freelancerId.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{contract.freelancerId.name}</strong>
                  <p>Freelancer</p>
                  <span className={contract.signedByFreelancer ? 'signed' : 'not-signed'}>
                    {contract.signedByFreelancer ? '✅ Signed' : '⏳ Not Signed'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="cd-sidebar">
          <div className="cd-card cd-summary">
            <h3>SUMMARY</h3>
            <div className="cd-row">
              <span>Budget</span>
              <strong>₹{contract.budget?.toLocaleString()}</strong>
            </div>
            <div className="cd-row">
              <span>Start Date</span>
              <strong>{new Date(contract.startDate).toLocaleDateString()}</strong>
            </div>
            <div className="cd-row">
              <span>End Date</span>
              <strong>{new Date(contract.endDate).toLocaleDateString()}</strong>
            </div>
          </div>

          {contract.status === 'PENDING' && !mySigned && (
            <button
              className="cd-btn-primary"
              onClick={handleSign}
              disabled={actionLoading}
            >
              {actionLoading ? 'Signing...' : '✍️ Sign Contract'}
            </button>
          )}

          {contract.status === 'PENDING' && mySigned && !otherSigned && (
            <div className="cd-notice">
              ⏳ Waiting for the other party to sign.
            </div>
          )}

          {contract.status === 'ACTIVE' && isOwner && (
            <button
              className="cd-btn-primary"
              onClick={handleComplete}
              disabled={actionLoading}
            >
              {actionLoading ? 'Completing...' : '✅ Mark as Completed'}
            </button>
          )}

          {contract.status === 'ACTIVE' && !isOwner && (
            <div className="cd-notice success">
              ✅ Contract is active. Work in progress.
            </div>
          )}

          {contract.status === 'COMPLETED' && (
            <div className="cd-notice success">
              ✅ Contract completed on{' '}
              {new Date(contract.completedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractDetail;