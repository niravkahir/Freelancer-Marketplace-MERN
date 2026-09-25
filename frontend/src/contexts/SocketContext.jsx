import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket } from '../services/socket';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      const s = connectSocket(token);
      setSocket(s);

      // ✅ Keep as array — your Chat.jsx uses .includes()
      s.on('onlineUsers', (users) => setOnlineUsers(users));

      return () => {
        disconnectSocket();
      };
    } else {
      setSocket(null);
      setOnlineUsers([]);
    }
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);