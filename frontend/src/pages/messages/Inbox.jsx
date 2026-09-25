import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Inbox.css';

const Inbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/conversations');
      setConversations(data.conversations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="inbox-state">Loading...</div>;

  return (
    <div className="inbox-page">
      <h1>MESSAGES</h1>
      <p className="inbox-sub">Your conversations</p>

      {conversations.length === 0 ? (
        <div className="inbox-state">
          No conversations yet. Start by messaging a freelancer from a proposal.
        </div>
      ) : (
        <div className="inbox-list">
          {conversations.map((c) => {
            const other = c.participants.find(
              (p) => p._id !== user.id && p._id !== user._id
            );
            const isLocked = c.isLocked;
            const projectTitle = c.relatedProject?.title || 'Project';

            return (
              <Link
                to={`/messages/${c._id}`}
                key={c._id}
                className="inbox-item"
              >
                <div className="inbox-avatar">
                  {other?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="inbox-body">
                  <div className="inbox-top">
                    <h3>{other?.name || 'Unknown'}</h3>
                    {c.myUnreadCount > 0 && (
                      <span className="inbox-unread">{c.myUnreadCount}</span>
                    )}
                  </div>
                  <p className="inbox-project">📁 {projectTitle}</p>
                  <p className="inbox-preview">
                    {c.lastMessage?.content
                      ? c.lastMessage.content.slice(0, 60) +
                        (c.lastMessage.content.length > 60 ? '...' : '')
                      : 'No messages yet'}
                  </p>
                </div>
                {isLocked && <span className="inbox-lock">🔒</span>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Inbox;