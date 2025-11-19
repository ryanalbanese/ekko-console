import { useState, useCallback } from 'react';
import type { Message } from '../types/api';

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

export interface UseConversationsReturn {
  conversations: Conversation[];
  activeConversationId: string | null;
  createNew: () => string;
  select: (id: string) => void;
  updateConversation: (id: string, message: Message) => void;
  clear: () => void;
}

/**
 * Hook for managing list of conversations (local state only, no persistence)
 */
export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const createNew = useCallback(() => {
    const newId = `conv-${Date.now()}`;
    const newConversation: Conversation = {
      id: newId,
      title: 'New conversation',
      lastMessage: '',
      timestamp: new Date().toISOString(),
      messageCount: 0,
    };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newId);
    return newId;
  }, []);

  const select = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const updateConversation = useCallback((id: string, message: Message) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) {
        // Update existing conversation
        const title = message.body
          ? message.body.substring(0, 50).trim() || 'New conversation'
          : 'New conversation';
        return prev.map((c) =>
          c.id === id
            ? {
                ...c,
                title,
                lastMessage: message.body || '',
                timestamp: message.timestamp,
                messageCount: c.messageCount + 1,
              }
            : c
        );
      } else {
        // Create new conversation
        const title = message.body
          ? message.body.substring(0, 50).trim() || 'New conversation'
          : 'New conversation';
        const newConversation: Conversation = {
          id,
          title,
          lastMessage: message.body || '',
          timestamp: message.timestamp,
          messageCount: 1,
        };
        return [newConversation, ...prev];
      }
    });
  }, []);

  const clear = useCallback(() => {
    setConversations([]);
    setActiveConversationId(null);
  }, []);

  return {
    conversations,
    activeConversationId,
    createNew,
    select,
    updateConversation,
    clear,
  };
}

