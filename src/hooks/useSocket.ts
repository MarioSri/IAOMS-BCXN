import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(WS_URL, {
      auth: { token }
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      socketRef.current.emit('user:join', { id: user.id, email: user.email });
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const subscribeToDocument = (documentId: string) => {
    socketRef.current?.emit('document:subscribe', documentId);
  };

  const onDocumentUpdate = (callback: (data: any) => void) => {
    socketRef.current?.on('document:updated', callback);
    return () => { socketRef.current?.off('document:updated', callback); };
  };

  const onNotification = (callback: (data: any) => void) => {
    socketRef.current?.on('notification', callback);
    return () => { socketRef.current?.off('notification', callback); };
  };

  return { subscribeToDocument, onDocumentUpdate, onNotification };
}