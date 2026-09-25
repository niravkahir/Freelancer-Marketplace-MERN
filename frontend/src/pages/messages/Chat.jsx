import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import './Chat.css';

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isClient } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // ✅ My ID as string for safe comparison
  const myId = (user?.id || user?._id)?.toString();

  const load = async () => {
    try {
      const { data } = await api.get(`/conversations/${id}`);
      setConversation(data.conversation);
      setMessages(data.messages || []);

      await api.put(`/messages/conversation/${id}/read`);
      if (socket) socket.emit('refreshUnread');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg) => {
      const convId = (msg.conversationId?._id || msg.conversationId)?.toString();
      if (convId === id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        api.put(`/messages/conversation/${id}/read`);
        socket.emit('refreshUnread');
      }
    };

    const onTyping = ({ senderId }) => {
      if (senderId?.toString() !== myId) setOtherTyping(true);
    };

    const onStopTyping = () => setOtherTyping(false);

    // ✅ Lock/unlock live update
    const onConvUpdate = (data) => {
      if (data.conversationId?.toString() === id) {
        setConversation((prev) =>
          prev
            ? {
                ...prev,
                isLocked: data.isLocked,
                lockReason: data.lockReason,
              }
            : prev
        );
      }
    };

    socket.on('receiveMessage', onReceive);
    socket.on('typing', onTyping);
    socket.on('stopTyping', onStopTyping);
    socket.on('conversationUpdated', onConvUpdate);

    return () => {
      socket.off('receiveMessage', onReceive);
      socket.off('typing', onTyping);
      socket.off('stopTyping', onStopTyping);
      socket.off('conversationUpdated', onConvUpdate);
    };
  }, [socket, id, myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const otherUser = conversation?.participants.find(
    (p) => p._id?.toString() !== myId
  );

  const isOtherOnline = otherUser
    ? onlineUsers.includes(otherUser._id?.toString()) ||
      onlineUsers.includes(otherUser._id)
    : false;

  const handleTyping = (e) => {
    setContent(e.target.value);

    if (socket && otherUser) {
      socket.emit('typing', {
        receiverId: otherUser._id,
        senderName: user.name,
      });

      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('stopTyping', { receiverId: otherUser._id });
      }, 1500);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !conversation) return;

    const text = content.trim();
    setSending(true);

    try {
      const { data } = await api.post('/messages', {
        conversationId: conversation._id,
        content: text,
      });

      setMessages((prev) => {
        if (prev.some((m) => m._id === data.message._id)) return prev;
        return [...prev, data.message];
      });
      setContent('');

      if (socket && otherUser) {
        socket.emit('stopTyping', { receiverId: otherUser._id });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleLock = async () => {
    try {
      await api.put(`/conversations/${id}/lock`);
      // Live update handled by socket conversationUpdated
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to lock');
    }
  };

  const handleUnlock = async () => {
    try {
      await api.put(`/conversations/${id}/unlock`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unlock');
    }
  };

  if (loading) return <div className="chat-state">Loading...</div>;
  if (error) return <div className="chat-state error">{error}</div>;
  if (!conversation) return null;

  const isLocked = conversation.isLocked;
  const canSend =
    !isLocked &&
    !(conversation.chatMode === 'PRE_HIRE' &&
      !isClient &&
      messages.length === 0);

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="chat-back" onClick={() => navigate('/messages')}>
          ←
        </button>
        <div className="chat-header-info">
          <div className="chat-avatar">
            {otherUser?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h3>{otherUser?.name || 'Unknown'}</h3>
            <p className={`chat-status ${isOtherOnline ? 'online' : ''}`}>
              {isOtherOnline ? '🟢 Online' : '⚪ Offline'}
            </p>
          </div>
        </div>

        <div className="chat-header-meta">
          <span className="chat-project">
            {conversation.relatedProject?.title}
          </span>
          {isClient && conversation.chatMode === 'PRE_HIRE' && (
            <>
              {isLocked ? (
                <button className="chat-lock-btn" onClick={handleUnlock}>
                  Restart Chat
                </button>
              ) : (
                <button className="chat-lock-btn" onClick={handleLock}>
                  🔒 Stop Chat
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="chat-locked">
          🔒 This conversation is locked.{' '}
          {conversation.lockReason === 'CLIENT_STOPPED' &&
            'Client stopped this chat.'}
          {conversation.lockReason === 'PROJECT_COMPLETED' &&
            'Project completed and paid.'}
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            {conversation.chatMode === 'PRE_HIRE' && !isClient
              ? 'Waiting for client to start the conversation.'
              : 'No messages yet. Say hi!'}
          </div>
        )}

        {messages.map((m) => {
          const senderId = (m.senderId?._id || m.senderId)?.toString();
          const isMine = senderId === myId;
          return (
            <div
              key={m._id}
              className={`chat-bubble ${isMine ? 'chat-mine' : 'chat-theirs'}`}
            >
              <p>{m.content}</p>
              <span className="chat-time">
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          );
        })}

        {otherTyping && (
          <div className="chat-typing">
            <span></span><span></span><span></span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {canSend && (
        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Type a message..."
            value={content}
            onChange={handleTyping}
            disabled={sending}
          />
          <button type="submit" disabled={sending || !content.trim()}>
            Send
          </button>
        </form>
      )}
    </div>
  );
};

export default Chat;