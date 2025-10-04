import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export const setSocketIO = (socketIO: SocketIOServer) => {
  io = socketIO;
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};
