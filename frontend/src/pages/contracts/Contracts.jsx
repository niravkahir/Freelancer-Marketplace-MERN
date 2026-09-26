import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import './Contracts.css';

const Contracts = () => {
  const { user, isClient } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/contracts');
      setContracts(data.contracts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ✅ Real-time refresh when a contract changes
  useEffect(() => {
    if (!socket) return;

    const onContractChanged = () => load();

    socket.on('contractChanged', onContractChanged);
    socket.on('newNotification', onContractChanged);

    return () => {
      socket.off('contractChanged', onContractChanged);
      socket.off('newNotification', onContractChanged);
    };
  }, [socket]);

  if (loading) return <div className="con-state">Loading...</div>;

  return (
    <div className="con-page">
      <div className="con-header">
        <div>
          <h1>CONTRACTS</h1>
          <p>Your active and past contracts</p>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="con-state">
          {isClient
            ? 'No contracts yet. Accept a proposal and create one.'
            : 'No contracts yet. They will appear here after the client creates one.'}
        </div>
      ) : (
        <div className="con-grid">
          {contracts.map((c) => {
            const isMine = c.clientId._id === user.id || c.clientId._id === user._id;
            const other = isMine ? c.freelancerId : c.clientId;
            const needsMySign = isMine
              ? !c.signedByClient
              : !c.signedByFreelancer;

            return (
              <div
                key={c._id}
                className="con-card"
                onClick={() => navigate(`/contracts/${c._id}`)}
              >
                <div className="con-card-top">
                  <span className={`con-status con-status-${c.status.toLowerCase()}`}>
                    {c.status}
                  </span>
                  <span className="con-id">#{c.contractId}</span>
                </div>

                <h3>{c.title}</h3>

                <p className="con-project">📁 {c.projectId?.title}</p>

                <div className="con-meta">
                  <span>₹{c.budget?.toLocaleString()}</span>
                  <span>·</span>
                  <span>{other?.name}</span>
                </div>

                {c.status === 'PENDING' && needsMySign && (
                  <div className="con-badge-sign">⚠️ Needs Your Signature</div>
                )}
                {c.status === 'PENDING' && !needsMySign && (
                  <div className="con-badge-wait">⏳ Waiting for other party</div>
                )}
                {c.status === 'ACTIVE' && (
                  <div className="con-badge-active">✅ Active</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Contracts;