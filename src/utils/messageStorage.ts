import type { StoredMessage } from '@/types/api';

const STORAGE_KEY = 'ekko_messages';

/**
 * Store message metadata in localStorage
 * Only stores non-PHI metadata (no subject or body)
 */
export function storeMessage(meta: StoredMessage): void {
  try {
    const stored = getStoredMessages();
    const existingIndex = stored.findIndex((m) => m.messageId === meta.messageId);
    
    if (existingIndex >= 0) {
      // Update existing message
      stored[existingIndex] = { ...stored[existingIndex], ...meta };
    } else {
      // Add new message
      stored.push(meta);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('Failed to store message:', error);
  }
}

/**
 * Get all stored messages from localStorage
 */
export function getStoredMessages(): StoredMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as StoredMessage[];
  } catch (error) {
    console.error('Failed to get stored messages:', error);
    return [];
  }
}

/**
 * Update the status of a stored message
 */
export function updateMessageStatus(
  messageId: string,
  status: "queued" | "sent" | "delivered" | "failed"
): void {
  try {
    const stored = getStoredMessages();
    const message = stored.find((m) => m.messageId === messageId);
    
    if (message) {
      message.lastKnownStatus = status;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  } catch (error) {
    console.error('Failed to update message status:', error);
  }
}

/**
 * Clear all stored messages from localStorage
 */
export function clearStoredMessages(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear stored messages:', error);
  }
}

