import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getCurrentToken, onTokenChange, isDemoMode } from '../utils/auth';
import type {
  MessageEvent,
  MessageEventType,
  MessageQueuedEvent,
  MessageSentEvent,
  MessageDeliveredEvent,
  MessageFailedEvent,
  TypingStartedEvent,
  TypingStoppedEvent,
} from '../types/api';

const WS_URL = import.meta.env.VITE_EKKO_WS_URL || 'http://localhost:8080';

export interface UseEkkoSocketReturn {
  isConnected: boolean;
  isReady: boolean;
  events: MessageEvent[];
  emitTypingStart: () => void;
  emitTypingStop: () => void;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Hook for managing Ekko WebSocket connection
 */
export function useEkkoSocket(): UseEkkoSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [events, setEvents] = useState<MessageEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    const token = getCurrentToken();
    if (!token) {
      setIsReady(false);
      setIsConnected(false);
      return;
    }

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Extract origin from WS_URL (Socket.IO handles protocol)
    const wsOrigin = new URL(WS_URL).origin;

    const socket = io(wsOrigin, {
      auth: {
        token,
      },
      transports: ['websocket'],
      timeout: 8000,
    });

    socketRef.current = socket;
    setIsReady(true);

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Subscribe to message events
    const handleMessageQueued = (payload: MessageQueuedEvent) => {
      setEvents((prev) => [
        ...prev,
        {
          type: 'message.queued',
          payload,
          timestamp: payload.timestamp || new Date().toISOString(),
        },
      ]);
    };

    const handleMessageSent = (payload: MessageSentEvent) => {
      setEvents((prev) => [
        ...prev,
        {
          type: 'message.sent',
          payload,
          timestamp: payload.timestamp || new Date().toISOString(),
        },
      ]);
    };

    const handleMessageDelivered = (payload: MessageDeliveredEvent) => {
      setEvents((prev) => [
        ...prev,
        {
          type: 'message.delivered',
          payload,
          timestamp: payload.timestamp || new Date().toISOString(),
        },
      ]);
    };

    const handleMessageFailed = (payload: MessageFailedEvent) => {
      setEvents((prev) => [
        ...prev,
        {
          type: 'message.failed',
          payload,
          timestamp: payload.timestamp || new Date().toISOString(),
        },
      ]);
    };

    const handleTypingStarted = (payload: TypingStartedEvent) => {
      setEvents((prev) => [
        ...prev,
        {
          type: 'typing.started',
          payload,
          timestamp: payload.timestamp || new Date().toISOString(),
        },
      ]);
    };

    const handleTypingStopped = (payload: TypingStoppedEvent) => {
      setEvents((prev) => [
        ...prev,
        {
          type: 'typing.stopped',
          payload,
          timestamp: payload.timestamp || new Date().toISOString(),
        },
      ]);
    };

    socket.on('message.queued', handleMessageQueued);
    socket.on('message.sent', handleMessageSent);
    socket.on('message.delivered', handleMessageDelivered);
    socket.on('message.failed', handleMessageFailed);
    socket.on('typing.started', handleTypingStarted);
    socket.on('typing.stopped', handleTypingStopped);
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsReady(false);
  }, []);

  const emitTypingStart = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing.start', {
        timestamp: new Date().toISOString(),
      });
    }
  }, [isConnected]);

  const emitTypingStop = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing.stop', {
        timestamp: new Date().toISOString(),
      });
    }
  }, [isConnected]);

  // Initial connection
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnect on token change
  useEffect(() => {
    const unsubscribe = onTokenChange(() => {
      disconnect();
      // Small delay to ensure cleanup
      setTimeout(() => {
        connect();
      }, 100);
    });

    return unsubscribe;
  }, [connect, disconnect]);

  return {
    isConnected,
    isReady,
    events,
    emitTypingStart,
    emitTypingStop,
    connect,
    disconnect,
  };
}


