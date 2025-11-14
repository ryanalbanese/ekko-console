import { useState, useEffect, useCallback } from 'react';
import type {
  Message,
  MessageStatus,
  MessageEvent,
  MessageQueuedEvent,
  MessageSentEvent,
  MessageDeliveredEvent,
  MessageFailedEvent,
} from '../types/api';

export interface UseConversationReturn {
  messages: Message[];
  conversationId: string | null;
  addMessage: (message: Omit<Message, 'timestamp' | 'status'>) => void;
  clearMessages: () => void;
}

interface UseConversationProps {
  events: MessageEvent[];
}

/**
 * Hook for managing conversation state
 */
export function useConversation({ events }: UseConversationProps): UseConversationReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Update messages based on WebSocket events
  useEffect(() => {
    events.forEach((event) => {
      if (event.type.startsWith('message.')) {
        const payload = event.payload as
          | MessageQueuedEvent
          | MessageSentEvent
          | MessageDeliveredEvent
          | MessageFailedEvent;

        setMessages((prev) => {
          const existingIndex = prev.findIndex(
            (msg) => msg.messageId === payload.messageId
          );

          let status: MessageStatus;
          switch (event.type) {
            case 'message.queued':
              status = 'queued';
              break;
            case 'message.sent':
              status = 'sent';
              break;
            case 'message.delivered':
              status = 'delivered';
              break;
            case 'message.failed':
              status = 'failed';
              break;
            default:
              return prev;
          }

          const updatedMessage: Message = {
            ...(existingIndex >= 0 ? prev[existingIndex] : {}),
            messageId: payload.messageId,
            conversationId: payload.conversationId,
            status,
            timestamp: payload.timestamp,
            ...(event.type === 'message.failed' && {
              error: (payload as MessageFailedEvent).error,
              isRetryable: (payload as MessageFailedEvent).isRetryable,
            }),
          } as Message;

          if (existingIndex >= 0) {
            // Update existing message
            const newMessages = [...prev];
            newMessages[existingIndex] = updatedMessage;
            return newMessages;
          } else {
            // Add new message (received from remote)
            return [
              ...prev,
              {
                ...updatedMessage,
                isLocal: false,
                body: '', // We don't have body from events, only status updates
                recipients: [],
              },
            ];
          }
        });

        // Update conversation ID
        if (payload.conversationId) {
          setConversationId(payload.conversationId);
        }
      }
    });
  }, [events]);

  const addMessage = useCallback(
    (message: Omit<Message, 'timestamp' | 'status'>) => {
      const newMessage: Message = {
        ...message,
        timestamp: new Date().toISOString(),
        status: 'pending',
        isLocal: true,
      };

      setMessages((prev) => [...prev, newMessage]);

      if (message.conversationId) {
        setConversationId(message.conversationId);
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  return {
    messages,
    conversationId,
    addMessage,
    clearMessages,
  };
}

