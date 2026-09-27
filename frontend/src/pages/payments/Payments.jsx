import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import './Payments.css';

const Payments = () => {
  const { user, isClient } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/payments');
      setPayments(data.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ✅ Real-time updates
  useEffect(() => {
    if (!socket) return;

    const onPaymentChanged = () => load();

    socket.on('paymentChanged', onPaymentChanged);

    return () => {
      socket.off('paymentChanged', onPaymentChanged);
    };
  }, [socket]);

  if (loading) return <div className="pay-state">Loading...</div>;

  // Totals
  const totalReceived = payments
    .filter((p) => p.freelancerId._id === user.id || p.freelancerId._id === user._id)
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalPaid = payments
    .filter((p) => p.clientId._id === user.id || p.clientId._id === user._id)
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="pay-page">
      <div className="pay-header">
        <div>
          <h1>PAYMENTS</h1>
          <p>Your payment history and pending transactions</p>
        </div>
      </div>

      {/* Totals */}
      <div className="pay-totals">
        {isClient && (
          <div className="pay-total-card">
            <span className="pay-total-label">TOTAL PAID</span>
            <span className="pay-total-value">₹{totalPaid.toLocaleString()}</span>
          </div>
        )}
        {!isClient && (
          <div className="pay-total-card">
            <span className="pay-total-label">TOTAL RECEIVED</span>
            <span className="pay-total-value">₹{totalReceived.toLocaleString()}</span>
          </div>
        )}
        <div className="pay-total-card">
          <span className="pay-total-label">TRANSACTIONS</span>
          <span className="pay-total-value">{payments.length}</span>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="pay-state">
          No payments yet.
        </div>
      ) : (
        <div className="pay-list">
          {payments.map((p) => {
            const isMine = p.clientId._id === user.id || p.clientId._id === user._id;
            const other = isMine ? p.freelancerId : p.clientId;
            const isIncoming = !isMine;

            return (
              <div
                key={p._id}
                className="pay-card"
                onClick={() => navigate(`/payments/${p._id}`)}
              >
                <div className="pay-card-left">
                  <div className={`pay-icon ${isIncoming ? 'incoming' : 'outgoing'}`}>
                    {isIncoming ? '💰' : '💸'}
                  </div>
                  <div>
                    <h3>{p.projectId?.title || 'Payment'}</h3>
                    <p className="pay-partner">
                      {isIncoming ? `From: ${other?.name}` : `To: ${other?.name}`}
                    </p>
                    <span className="pay-date">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pay-card-right">
                  <div className={`pay-amount ${isIncoming ? 'incoming' : 'outgoing'}`}>
                    {isIncoming ? '+' : '-'}₹{p.amount?.toLocaleString()}
                  </div>
                  <span className={`pay-status pay-status-${p.status.toLowerCase()}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Payments;