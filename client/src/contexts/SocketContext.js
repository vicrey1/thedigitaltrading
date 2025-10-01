import React, { createContext, useContext, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef();

  useEffect(() => {
    // Replace with your server URL
    socketRef.current = io('http://localhost:3001');
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
