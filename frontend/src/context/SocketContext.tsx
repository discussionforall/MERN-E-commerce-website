import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();


  useEffect(() => {
    if (user) {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.warn('No access token found, skipping socket connection');
        return;
      }

      // Only create new socket if we don't have one
      if (!socket) {
        
        // Connect to socket server
        const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://backend:5000', {
          auth: {
            token: accessToken
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: false, // Don't force new connection
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000
        });

        newSocket.on('connect', () => {
          setIsConnected(true);
        });

        newSocket.on('disconnect', (_reason) => {
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setIsConnected(false);
        });

        newSocket.on('reconnect', (_attemptNumber) => {
          setIsConnected(true);
        });

        newSocket.on('reconnect_error', (error) => {
          console.error('Socket reconnection error:', error);
          setIsConnected(false);
        });

        newSocket.on('reconnect_failed', () => {
          console.error('Socket reconnection failed');
          setIsConnected(false);
        });

        setSocket(newSocket);
      } else {
        setIsConnected(socket.connected);
      }
    } else {
      // Disconnect if no user
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user]); // Remove socket from dependencies to prevent infinite loop

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
