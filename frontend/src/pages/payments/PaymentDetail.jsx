import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import './PaymentDetail.css';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isClient } = useAuth();
  const { socket } = useSocket();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/payments/${id}`);
      setPayment(data.payment);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // ✅ Real-time refresh on paymentChanged
  useEffect(() => {
    if (!socket) return;

    const onPaymentChanged = (data) => {
      if (data.paymentId?.toString() === id) {
        load();
      }
    };

    socket.on('paymentChanged', onPaymentChanged);

    return () => {
      socket.off('paymentChanged', onPaymentChanged);
    };
  }, [socket, id]);

  // ✅ Razorpay Payment
  const handlePayNow = async () => {
    setPaying(true);
    try {
      // Step 1: Create order on backend
      const { data: orderData } = await api.post('/payments/create-order', {
        paymentId: payment._id,
      });

      // Step 2: Open Razorpay Checkout
      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Freelancer Marketplace',
        description: `Payment for ${payment.projectId?.title}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          // Step 3: Verify on backend
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: payment._id,
            });
            await load();
          } catch (err) {
            alert(err.response?.data?.message || 'Verification failed');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#d4af37',
        },
      };

      if (!window.Razorpay) {
        alert('Razorpay not loaded. Refresh page.');
        setPaying(false);
        return;
      }

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        alert(`Payment failed: ${response.error.description}`);
      });

      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="pd2-state">Loading...</div>;
  if (error) return <div className="pd2-state error">{error}</div>;
  if (!payment) return null;

  const isOwner = payment.clientId._id === (user?.id || user?._id);
  const canPay = isOwner && payment.status !== 'COMPLETED' && isClient;

  return (
    <div className="pd2-page">
      <button className="btn-back" onClick={() => navigate('/payments')}>
        ← Back to Payments
      </button>

      <div className="pd2-header">
        <div className="pd2-header-top">
          <span className={`pd2-status pd2-status-${payment.status.toLowerCase()}`}>
            {payment.status}
          </span>
          <span className="pd2-id">
            {payment.transactionId ? `TXN: ${payment.transactionId}` : `#${payment.paymentId || payment._id.slice(-6)}`}
          </span>
        </div>
        <h1>₹{payment.amount?.toLocaleString()}</h1>
        <p className="pd2-project">📁 {payment.projectId?.title}</p>
      </div>

      <div className="pd2-grid">
        <div className="pd2-main">
          <div className="pd2-card">
            <h3>PARTIES</h3>
            <div className="pd2-party">
              <div className="pd2-avatar">
                {payment.clientId.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{payment.clientId.name}</strong>
                <p>Client (Payer)</p>
              </div>
            </div>
            <div className="pd2-party">
              <div className="pd2-avatar">
                {payment.freelancerId.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{payment.freelancerId.name}</strong>
                <p>Freelancer (Receiver)</p>
              </div>
            </div>
          </div>

          {payment.status === 'COMPLETED' && (
            <div className="pd2-card pd2-success">
              <h3>PAYMENT SUCCESSFUL ✅</h3>
              <p>
                Completed on{' '}
                {new Date(payment.completionDate).toLocaleString()}
              </p>
              <p className="pd2-txn">
                <strong>Transaction ID:</strong> {payment.transactionId}
              </p>
            </div>
          )}
        </div>

        <div className="pd2-sidebar">
          <div className="pd2-card">
            <h3>DETAILS</h3>
            <div className="pd2-row">
              <span>Amount</span>
              <strong>₹{payment.amount?.toLocaleString()}</strong>
            </div>
            <div className="pd2-row">
              <span>Payment Method</span>
              <strong>{payment.paymentMethod}</strong>
            </div>
            <div className="pd2-row">
              <span>Created</span>
              <strong>{new Date(payment.createdAt).toLocaleDateString()}</strong>
            </div>
            <div className="pd2-row">
              <span>Status</span>
              <strong>{payment.status}</strong>
            </div>
          </div>

          {canPay && (
            <button
              className="pd2-btn-primary"
              onClick={handlePayNow}
              disabled={paying}
            >
              {paying ? 'Processing...' : `💰 Pay ₹${payment.amount?.toLocaleString()}`}
            </button>
          )}

          {payment.status === 'PROCESSING' && (
            <div className="pd2-notice">
              ⏳ Payment in progress. Complete it in the Razorpay modal.
            </div>
          )}

          {isOwner && payment.status === 'COMPLETED' && (
            <div className="pd2-notice success">
              ✅ Payment completed successfully.
            </div>
          )}

          {!isOwner && payment.status === 'COMPLETED' && (
            <div className="pd2-notice success">
              ✅ Payment received.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;