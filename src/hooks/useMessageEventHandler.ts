import { useEffect, useRef } from 'react';
import { useMessageEvents, type NormalizedMessageEvent } from './useMessageEvents';
import { storeMessage, updateMessageStatus, getStoredMessages } from '@/utils/messageStorage';
import { usePlaygroundHandlersContext } from '@/contexts/PlaygroundHandlersContext';
import { getMessageContentById } from '@/utils/apiClient';
import type { Message } from '@/types/api';

export interface PlaygroundHandlers {
  conversations: Array<{ id: string }>;
  messagesByConversation?: Record<string, Message[]>;
  updateMessageStatus: (conversationId: string, messageId: string, status: Message['status'], error?: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  createConversation: (recipientAddress: string, label?: string) => string;
  updateConversationId: (oldId: string, newId: string) => void;
}

/**
 * Centralized message event handler that processes all message.* events
 * Mounted once at top level to avoid duplicate subscriptions
 * Handles both messageStorage updates and Playground conversation updates
 * 
 * When a WebSocket event arrives:
 * 1. Updates messageStorage with metadata
 * 2. Fetches full message content via API
 * 3. Parses content and displays in Playground UI
 */
export function useMessageEventHandler(): void {
  const events = useMessageEvents();
  const playgroundHandlers = usePlaygroundHandlersContext();
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  const processedMessageIdsRef = useRef<Set<string>>(new Set()); // Track processed messageIds for 'sent' events
  const fetchingMessageIdsRef = useRef<Set<string>>(new Set()); // Track in-flight fetches

  useEffect(() => {
    // Process each new event
    events.forEach((event: NormalizedMessageEvent) => {
      const eventId = `${event.eventType}:${event.messageId}:${event.timestamp}`;

      // Skip if already processed in this handler
      if (processedEventIdsRef.current.has(eventId)) {
        return;
      }

      // For 'sent' events, check if we've already processed a 'sent' event for this messageId
      // This prevents duplicate processing when status check emits a second 'sent' event
      // Check BEFORE processing to prevent race conditions
      if (event.status === 'sent') {
        if (processedMessageIdsRef.current.has(event.messageId)) {
          console.log('[useMessageEventHandler] Skipping duplicate sent event for messageId:', event.messageId);
          // Still mark the eventId as processed to avoid reprocessing
          processedEventIdsRef.current.add(eventId);
          return;
        }
        // Mark as processed immediately to prevent race conditions
        processedMessageIdsRef.current.add(event.messageId);
      }

      processedEventIdsRef.current.add(eventId);
      
      console.log('[useMessageEventHandler] Processing event:', {
        eventType: event.eventType,
        messageId: event.messageId,
        conversationId: event.conversationId,
        status: event.status,
      });

      // 1. Update messageStorage with metadata from event
      const existingMessages = getStoredMessages();
      const existingMessage = existingMessages.find((m) => m.messageId === event.messageId);

      if (existingMessage) {
        // Update existing message status and timestamp
        updateMessageStatus(event.messageId, event.status);
      } else {
        // Store new message - default to 'api' source for messages from WebSocket events
        storeMessage({
          messageId: event.messageId,
          conversationId: event.conversationId,
          timestamp: new Date(event.timestamp).getTime(),
          chosenChannel: event.chosenChannel,
          lastKnownStatus: event.status,
          source: 'api',
        });
      }

      // 2. Update Playground conversations (if handlers available via context)
      if (!playgroundHandlers) {
        return;
      }

      const { 
        conversations, 
        updateMessageStatus: updatePlaygroundStatus, 
        addMessage, 
        createConversation,
        updateConversationId,
        messagesByConversation
      } = playgroundHandlers;

      // Only fetch content for 'sent' or 'delivered' events, not 'queued'
      // When a message is queued, the content might not be available yet
      if (event.status === 'queued') {
        // For queued messages, just update status if message already exists
        const existingConversation = conversations.find((c) => c.id === event.conversationId);
        if (existingConversation) {
          const conversationMessages = messagesByConversation?.[event.conversationId] || [];
          const messageExists = conversationMessages.some((m) => m.messageId === event.messageId);
          if (messageExists) {
            updatePlaygroundStatus(event.conversationId, event.messageId, event.status, event.error);
          }
        }
        // Don't fetch content yet - wait for 'sent' or 'delivered' event
        return;
      }

      // Check if message already exists in conversation - if so, just update status and skip fetch
      const existingConversation = conversations.find((c) => c.id === event.conversationId);
      if (existingConversation) {
        const conversationMessages = messagesByConversation?.[event.conversationId] || [];
        
        // First, check if message exists with exact messageId match
        let existingMessage = conversationMessages.find((m) => m.messageId === event.messageId);
        
        // If not found, check for a recently added "queued" message in the same conversation
        // This handles the case where optimistic message has temporary messageId but event has final messageId
        if (!existingMessage && event.status === 'sent') {
          // Find the most recent "queued" message in this conversation (likely the optimistic one)
          const queuedMessages = conversationMessages
            .filter((m) => m.status === 'queued' && m.isLocal)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          if (queuedMessages.length > 0) {
            // Check if the most recent queued message was added recently (within 10 seconds)
            const mostRecentQueued = queuedMessages[0];
            const messageTime = new Date(mostRecentQueued.timestamp).getTime();
            const eventTime = new Date(event.timestamp).getTime();
            const timeDiff = Math.abs(eventTime - messageTime);
            
            if (timeDiff < 10000) { // 10 seconds
              // This is likely the same message - update it instead of adding a new one
              console.log('[useMessageEventHandler] Found matching queued message, updating to sent:', {
                conversationId: event.conversationId,
                queuedMessageId: mostRecentQueued.messageId,
                eventMessageId: event.messageId,
                timeDiff,
              });
              
              // Update status first
              updatePlaygroundStatus(event.conversationId, mostRecentQueued.messageId, event.status, event.error);
              
              // If messageIds are different, we need to update the messageId too
              // We'll do this by removing the old message and adding a new one with the correct messageId
              // But first, let's mark this messageId as processed so we don't add it again
              processedMessageIdsRef.current.add(event.messageId);
              
              // Update stored message with final messageId
              const storedMessages = getStoredMessages();
              const storedMsg = storedMessages.find((m) => m.messageId === mostRecentQueued.messageId);
              if (storedMsg && storedMsg.messageId !== event.messageId) {
                // Remove old stored message and add new one with final messageId
                const updatedStored = storedMessages.filter((m) => m.messageId !== mostRecentQueued.messageId);
                updatedStored.push({
                  ...storedMsg,
                  messageId: event.messageId,
                  lastKnownStatus: event.status,
                });
                localStorage.setItem('ekko:messages', JSON.stringify(updatedStored));
              }
              
              // Don't fetch content - we already have the message, just needed to update status/messageId
              return;
            }
          }
        }
        
        if (existingMessage) {
          // Message already exists - just update status, don't fetch content again
          console.log('[useMessageEventHandler] Message already exists, updating status:', {
            conversationId: event.conversationId,
            messageId: event.messageId,
            status: event.status,
          });
          updatePlaygroundStatus(event.conversationId, event.messageId, event.status, event.error);
          return;
        }
      }

      // Check if we're already fetching this message (avoid duplicate API calls)
      if (fetchingMessageIdsRef.current.has(event.messageId)) {
        // If message already exists in a conversation, just update its status
        if (existingConversation) {
          const conversationMessages = messagesByConversation?.[event.conversationId] || [];
          const messageExists = conversationMessages.some((m) => m.messageId === event.messageId);
          if (messageExists) {
            updatePlaygroundStatus(event.conversationId, event.messageId, event.status, event.error);
          }
        }
        return;
      }

      // Fetch message content immediately when event arrives (for 'sent' or 'delivered' status)
      fetchingMessageIdsRef.current.add(event.messageId);

      // Capture current conversation state before async operation
      const currentConversations = conversations;
      const currentMessagesByConversation = messagesByConversation;

      // Helper function to process message content
      const processMessageContent = (content: any, retryCount = 0) => {
        console.log('[useMessageEventHandler] Processing message content:', {
          messageId: event.messageId,
          hasContent: !!content,
          contentKeys: content ? Object.keys(content) : [],
          to: content?.to,
          subject: content?.subject,
          hasTextBody: !!content?.textBody,
          hasHtmlBody: !!content?.htmlBody,
          status: content?.status || event.status,
          retryCount,
        });

        // Check if content is available (has to, subject, or body)
        const hasContent = content && (
          (content.to && content.to.length > 0) ||
          content.subject ||
          content.textBody ||
          content.htmlBody
        );

        // If content is not available and status is sent/delivered, retry after a delay
        // (We only fetch on sent/delivered, so if content isn't available, retry)
        if (!hasContent && (event.status === 'sent' || event.status === 'delivered') && retryCount < 2) {
          console.log('[useMessageEventHandler] Content not available yet, retrying...', {
            messageId: event.messageId,
            status: event.status,
            retryCount,
          });
          
          // Retry after delay: 1s, 2s
          setTimeout(() => {
            getMessageContentById(event.messageId)
              .then((retryContent: any) => {
                processMessageContent(retryContent, retryCount + 1);
              })
              .catch((error) => {
                console.error('[useMessageEventHandler] Retry fetch failed:', error);
                // Fall through to fallback handling
                processMessageContent(null, retryCount + 1);
              });
          }, (retryCount + 1) * 1000);
          return;
        }

        // If still no content after retries, use fallback
        if (!hasContent) {
          console.warn('[useMessageEventHandler] Content not available after retries, using fallback:', {
            messageId: event.messageId,
            status: event.status,
          });
          
          // Fallback: Create conversation and stub message
          let conversation = currentConversations.find((c) => c.id === event.conversationId);
          
          if (!conversation) {
            const tempId = createConversation('unknown', 'API message');
            if (tempId !== event.conversationId) {
              updateConversationId(tempId, event.conversationId);
            }
          }

          const conversationMessages = currentMessagesByConversation?.[event.conversationId] || [];
          const messageExists = conversationMessages.some((m) => m.messageId === event.messageId);
          
          if (!messageExists) {
            const stubMessage: Message = {
              messageId: event.messageId,
              conversationId: event.conversationId,
              body: 'Message sent via Ekko API',
              status: event.status,
              timestamp: event.timestamp,
              isLocal: true, // All messages in Playground are outgoing (sent by Ekko identity)
              recipients: [],
              ...(event.error && { error: event.error }),
            };
            addMessage(event.conversationId, stubMessage);
          } else {
            updatePlaygroundStatus(event.conversationId, event.messageId, event.status, event.error);
          }
          
          fetchingMessageIdsRef.current.delete(event.messageId);
          return;
        }

        // Content is available - process it
        // Extract recipient from content
        const recipientEmail = content.to?.[0]?.email || content.to?.[0]?.address;
        const recipientAddress = recipientEmail || 'unknown';
        const finalConversationId = content.conversationId || event.conversationId;
        
        // Check if conversation already exists (using captured state)
        let existingConversation = currentConversations.find((c) => c.id === finalConversationId);
        
        if (!existingConversation) {
          // Create new conversation with recipient from content
          const tempId = createConversation(recipientAddress, recipientAddress !== 'unknown' ? recipientAddress : 'API message');
          
          // Update conversation ID if needed
          if (tempId !== finalConversationId) {
            updateConversationId(tempId, finalConversationId);
          }
        }

        // Check if message already exists in conversation (use latest state, not captured)
        // This is important because the optimistic message might have been added after we captured state
        const latestMessages = messagesByConversation?.[finalConversationId] || [];
        const messageExists = latestMessages.some((m) => m.messageId === event.messageId);

        if (messageExists) {
          // Message exists - just update status
          console.log('[useMessageEventHandler] Message already exists, updating status:', {
            conversationId: finalConversationId,
            messageId: event.messageId,
            status: event.status,
          });
          updatePlaygroundStatus(finalConversationId, event.messageId, event.status, event.error);
          fetchingMessageIdsRef.current.delete(event.messageId);
        } else {
          // Create message from content
          const messageBody = content.textBody || content.htmlBody || '';
          const message: Message = {
            messageId: content.messageId || event.messageId,
            conversationId: finalConversationId,
            body: messageBody,
            subject: content.subject,
            sender: content.from,
            recipients: (content.to || []).map((r: any) => ({
              email: r.email || r.address,
              type: r.type || 'TO',
            })),
            status: (content.status || event.status) as Message['status'],
            timestamp: content.sentAt || content.deliveredAt || event.timestamp,
            isLocal: true, // All messages in Playground are outgoing (sent by Ekko identity)
            ...(event.error && { error: event.error }),
            ...(event.isRetryable !== undefined && { isRetryable: event.isRetryable }),
          };

          console.log('[useMessageEventHandler] Adding message to conversation:', {
            conversationId: finalConversationId,
            messageId: message.messageId,
            hasBody: !!message.body,
            bodyLength: message.body?.length,
            bodyPreview: message.body?.substring(0, 100),
            subject: message.subject,
            recipients: message.recipients,
          });

          // Add message to conversation (using final conversation ID)
          addMessage(finalConversationId, message);
        }
        
        fetchingMessageIdsRef.current.delete(event.messageId);
      };

      getMessageContentById(event.messageId)
        .then((content: any) => {
          processMessageContent(content);
        })
        .catch((error) => {
          // Remove from fetching set on error
          fetchingMessageIdsRef.current.delete(event.messageId);
          
          console.error('[useMessageEventHandler] Failed to fetch message content:', error);
          
          // Fallback: Create conversation and stub message if fetch fails
          let conversation = conversations.find((c) => c.id === event.conversationId);
          
          if (!conversation) {
            const tempId = createConversation('unknown', 'API message');
            if (tempId !== event.conversationId) {
              updateConversationId(tempId, event.conversationId);
            }
          }

          // Add stub message as fallback
          const conversationMessages = messagesByConversation?.[event.conversationId] || [];
          const messageExists = conversationMessages.some((m) => m.messageId === event.messageId);
          
          if (!messageExists) {
            const stubMessage: Message = {
              messageId: event.messageId,
              conversationId: event.conversationId,
              body: 'Message sent via Ekko API',
              status: event.status,
              timestamp: event.timestamp,
              isLocal: true, // All messages in Playground are outgoing (sent by Ekko identity)
              recipients: [],
              ...(event.error && { error: event.error }),
            };
            addMessage(event.conversationId, stubMessage);
          } else {
            // Update status even if fetch failed
            updatePlaygroundStatus(event.conversationId, event.messageId, event.status, event.error);
          }
        });
    });
  }, [events, playgroundHandlers]);
}

