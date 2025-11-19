import { useState, useCallback, useEffect } from 'react';
import type { Message } from '../types/api';

export interface PlaygroundConversation {
  id: string;
  recipientAddress: string;
  label?: string;
  lastMessagePreview?: string;
  lastUpdatedAt?: string;
}

export interface UsePlaygroundConversationsReturn {
  conversations: PlaygroundConversation[];
  activeConversationId: string | null;
  messagesByConversation: Record<string, Message[]>;
  createConversation: (recipientAddress: string, label?: string) => string;
  selectConversation: (id: string) => void;
  updateConversation: (id: string, message: Message) => void;
  updateConversationId: (oldId: string, newId: string) => void;
  deleteConversation: (id: string) => void;
  clearMessages: (conversationId: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessageStatus: (conversationId: string, messageId: string, status: Message['status'], error?: string) => void;
  getMessages: (conversationId: string) => Message[];
}

const STORAGE_KEY_CONVERSATIONS = 'ekko_playground_conversations';
const STORAGE_KEY_MESSAGES = 'ekko_playground_messages';
const STORAGE_KEY_ACTIVE = 'ekko_playground_active';

/**
 * Hook for managing playground conversations (persisted in sessionStorage)
 * Each conversation is bound to one recipient email
 * Data persists during browser session but clears when tab/window closes
 */
export function usePlaygroundConversations(): UsePlaygroundConversationsReturn {
  // Load from sessionStorage on mount
  const [conversations, setConversations] = useState<PlaygroundConversation[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY_ACTIVE) || null;
    } catch {
      return null;
    }
  });

  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_MESSAGES);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Save to sessionStorage whenever conversations change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }, [conversations]);

  // Save to sessionStorage whenever activeConversationId changes
  useEffect(() => {
    try {
      if (activeConversationId) {
        sessionStorage.setItem(STORAGE_KEY_ACTIVE, activeConversationId);
      } else {
        sessionStorage.removeItem(STORAGE_KEY_ACTIVE);
      }
    } catch (error) {
      console.error('Failed to save active conversation:', error);
    }
  }, [activeConversationId]);

  // Save to sessionStorage whenever messages change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messagesByConversation));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  }, [messagesByConversation]);

  const createConversation = useCallback((recipientAddress: string, label?: string): string => {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newConversation: PlaygroundConversation = {
      id,
      recipientAddress,
      label,
      lastUpdatedAt: new Date().toISOString(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(id);
    setMessagesByConversation((prev) => ({ ...prev, [id]: [] }));
    return id;
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const updateConversation = useCallback((id: string, message: Message) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (!existing) return prev;

      const preview = message.body
        ? message.body.substring(0, 50).trim() || '(No message text)'
        : '(No message text)';

      return prev.map((c) =>
        c.id === id
          ? {
              ...c,
              lastMessagePreview: preview,
              lastUpdatedAt: message.timestamp,
            }
          : c
      );
    });
  }, []);

  const updateConversationId = useCallback((oldId: string, newId: string) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === oldId);
      if (!existing) return prev;

      // Check if newId already exists
      if (prev.some((c) => c.id === newId)) {
        // If it exists, we might need to merge, but for now just update the old one
        return prev.map((c) => (c.id === oldId ? { ...c, id: newId } : c));
      }

      return prev.map((c) => (c.id === oldId ? { ...c, id: newId } : c));
    });

    // Update messages mapping
    setMessagesByConversation((prev) => {
      if (!prev[oldId]) return prev;
      const updated = { ...prev };
      updated[newId] = updated[oldId];
      delete updated[oldId];
      return updated;
    });

    // Update active conversation ID if needed
    setActiveConversationId((prev) => (prev === oldId ? newId : prev));
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setMessagesByConversation((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  }, [activeConversationId]);

  const clearMessages = useCallback((conversationId: string) => {
    setMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: [],
    }));
    // Also update conversation metadata
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessagePreview: undefined,
              lastUpdatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  }, []);

  const addMessage = useCallback((conversationId: string, message: Message) => {
    setMessagesByConversation((prev) => {
      const existing = prev[conversationId] || [];
      // Check if message already exists
      if (existing.some((m) => m.messageId === message.messageId)) {
        return prev;
      }
      return {
        ...prev,
        [conversationId]: [...existing, message],
      };
    });
    updateConversation(conversationId, message);
  }, [updateConversation]);

  const updateMessageStatus = useCallback(
    (conversationId: string, messageId: string, status: Message['status'], error?: string) => {
      setMessagesByConversation((prev) => {
        const messages = prev[conversationId] || [];
        const updated = messages.map((msg) =>
          msg.messageId === messageId
            ? { ...msg, status, ...(error && { error }) }
            : msg
        );
        return {
          ...prev,
          [conversationId]: updated,
        };
      });
    },
    []
  );

  const getMessages = useCallback(
    (conversationId: string): Message[] => {
      return messagesByConversation[conversationId] || [];
    },
    [messagesByConversation]
  );

  return {
    conversations,
    activeConversationId,
    messagesByConversation,
    createConversation,
    selectConversation,
    updateConversation,
    updateConversationId,
    deleteConversation,
    clearMessages,
    addMessage,
    updateMessageStatus,
    getMessages,
  };
}



