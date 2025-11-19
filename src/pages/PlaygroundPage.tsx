import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ConversationsList } from '@/components/playground/ConversationsList';
import { ChatArea } from '@/components/playground/ChatArea';
import { PlaygroundComposer } from '@/components/playground/PlaygroundComposer';
import { useEkkoSocketContext } from '@/contexts/EkkoSocketContext';
import { usePlaygroundConversations } from '@/hooks/usePlaygroundConversations';
import { updateMessageStatus as updateStoredMessageStatus } from '@/utils/messageStorage';
import type { Message, MessageEvent } from '@/types/api';
import { AppLayout } from '@/components/layout/AppLayout';

export function PlaygroundPage() {
  const { isConnected, events } = useEkkoSocketContext();
  const {
    conversations,
    activeConversationId,
    messagesByConversation,
    createConversation,
    selectConversation,
    addMessage,
    updateMessageStatus,
    updateConversationId,
    getMessages,
    clearMessages,
    deleteConversation,
  } = usePlaygroundConversations();

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activeMessages = activeConversationId ? getMessages(activeConversationId) : [];

  // Handle WebSocket events
  useEffect(() => {
    events.forEach((event: MessageEvent) => {
      if (event.type.startsWith('message.')) {
        const payload = event.payload as any;
        const conversationId = payload.conversationId;

        if (!conversationId) return;

        // Only update status if we have this conversation
        const targetConversation = conversations.find((c) => c.id === conversationId);
        if (!targetConversation) {
          // Skip events for conversations we don't have
          // This could be from other sessions or conversations created elsewhere
          return;
        }

        if (event.type === 'message.queued') {
          updateMessageStatus(conversationId, payload.messageId, 'queued');
          updateStoredMessageStatus(payload.messageId, 'queued');
        } else if (event.type === 'message.sent') {
          updateMessageStatus(conversationId, payload.messageId, 'sent');
          updateStoredMessageStatus(payload.messageId, 'sent');
        } else if (event.type === 'message.delivered') {
          updateMessageStatus(conversationId, payload.messageId, 'delivered');
          updateStoredMessageStatus(payload.messageId, 'delivered');
        } else if (event.type === 'message.failed') {
          updateMessageStatus(
            conversationId,
            payload.messageId,
            'failed',
            payload.error
          );
          updateStoredMessageStatus(payload.messageId, 'failed');
        }
      }
    });
  }, [events, conversations, updateMessageStatus]);

  const handleMessageSent = (message: Message) => {
    if (message.conversationId && activeConversationId) {
      // If the API returned a different conversationId, update our local conversation
      if (message.conversationId !== activeConversationId) {
        updateConversationId(activeConversationId, message.conversationId);
      }
      // Add the message using the API's conversationId
      addMessage(message.conversationId, message);
    }
  };

  const headerContent = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link to="/playground">Playground</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>Test sending messages through Ekko.</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <AppLayout headerContent={headerContent}>
      <div className="flex flex-1 overflow-hidden">
        <ConversationsList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={selectConversation}
          onCreate={createConversation}
          onDelete={deleteConversation}
        />
        <div className="flex flex-1 flex-col">
          <ChatArea
            messages={activeMessages}
            activeConversationId={activeConversationId}
            onClearMessages={activeConversationId ? () => clearMessages(activeConversationId) : undefined}
          />
          <PlaygroundComposer
            activeConversationId={activeConversationId}
            recipientAddress={activeConversation?.recipientAddress || null}
            isConnected={isConnected}
            onMessageSent={handleMessageSent}
            hasMessages={activeMessages.length > 0}
          />
        </div>
      </div>
    </AppLayout>
  );
}



