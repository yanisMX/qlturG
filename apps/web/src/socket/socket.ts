import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (!socket) {
    socket = io(`${import.meta.env.VITE_WS_URL}/game`, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  if (token) {
    socket.auth = { token };
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
