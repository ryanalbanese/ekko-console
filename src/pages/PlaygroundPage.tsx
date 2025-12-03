import { useState } from 'react';
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
import { PlaygroundHandlersProvider } from '@/contexts/PlaygroundHandlersContext';
import { useMessageEventHandler } from '@/hooks/useMessageEventHandler';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NewConversationDialog } from '@/components/playground/NewConversationDialog';
import type { Message } from '@/types/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { getSelectedIdentity } from '@/utils/auth';

interface PlaygroundPageContentProps {
  handlers: ReturnType<typeof usePlaygroundConversations>;
}

function PlaygroundPageContent({ handlers }: PlaygroundPageContentProps) {
  const { isConnected } = useEkkoSocketContext();
  // Mount handler here where it has access to the provider context
  useMessageEventHandler();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const {
    conversations,
    activeConversationId,
    createConversation,
    selectConversation,
    getMessages,
    clearMessages,
    deleteConversation,
  } = handlers;

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activeMessages = activeConversationId ? getMessages(activeConversationId) : [];
  const hasConversations = conversations.length > 0;

  /**
   * Determine the other participant in the conversation by examining messages.
   * This ensures that when replying, we send to the correct recipient regardless
   * of who originally created the conversation.
   */
  const getOtherParticipant = (conversationId: string | null): string | null => {
    if (!conversationId || activeMessages.length === 0) {
      // Fallback to stored recipientAddress if no messages yet
      return activeConversation?.recipientAddress || null;
    }

    const selectedIdentity = getSelectedIdentity();
    if (!selectedIdentity) {
      // Fallback if no identity selected
      return activeConversation?.recipientAddress || null;
    }

    const currentUserAddress = selectedIdentity.address.toLowerCase().trim();

    // Look through messages to find the other participant
    for (const message of activeMessages) {
      // Get sender address
      let senderAddress: string | undefined;
      if (typeof message.from === 'string') {
        senderAddress = message.from;
      } else if (message.from && typeof message.from === 'object' && 'address' in message.from) {
        senderAddress = (message.from as { address: string }).address;
      } else if (message.sender) {
        // Legacy fallback
        senderAddress = message.sender;
      }
      const normalizedSender = senderAddress?.toLowerCase().trim();

      // Get recipient addresses
      const recipients = message.recipients || [];
      const recipientAddresses = recipients
        .map((r) => (r.email || r.address)?.toLowerCase().trim())
        .filter((addr): addr is string => !!addr);

      // If current user is the sender, return the first recipient (other participant)
      if (normalizedSender === currentUserAddress && recipientAddresses.length > 0) {
        // Find a recipient that's not the current user
        const otherRecipient = recipientAddresses.find((addr) => addr !== currentUserAddress);
        if (otherRecipient) {
          return otherRecipient;
        }
        // If all recipients are the current user (self-send), return the first one anyway
        return recipientAddresses[0] || null;
      }

      // If current user is a recipient, return the sender (other participant)
      if (recipientAddresses.includes(currentUserAddress) && normalizedSender && normalizedSender !== currentUserAddress) {
        return normalizedSender;
      }
    }

    // Fallback to stored recipientAddress if we couldn't determine from messages
    return activeConversation?.recipientAddress || null;
  };

  const otherParticipant = getOtherParticipant(activeConversationId);

  const handleCreate = (recipientAddress: string, label?: string) => {
    createConversation(recipientAddress, label);
    setDialogOpen(false);
  };

  const handleMessageSent = (message: Message) => {
    if (message.conversationId && activeConversationId) {
      // If the API returned a different conversationId, update our local conversation
      if (message.conversationId !== activeConversationId) {
        handlers.updateConversationId(activeConversationId, message.conversationId);
      }
      // Add the message using the API's conversationId
      handlers.addMessage(message.conversationId, message);
    }
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      {hasConversations && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setDialogOpen(true)}
              >
                <MessageSquarePlus className="h-4 w-4" />
                <span className="sr-only">New conversation</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>New conversation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );

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
    <>
      <AppLayout headerContent={headerContent} headerActions={headerActions}>
        <div className="flex flex-1 overflow-hidden">
          <ConversationsList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={selectConversation}
            onCreate={createConversation}
            onDelete={deleteConversation}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <ChatArea
              messages={activeMessages}
              activeConversationId={activeConversationId}
              onClearMessages={activeConversationId ? () => clearMessages(activeConversationId) : undefined}
            />
            <PlaygroundComposer
              activeConversationId={activeConversationId}
              recipientAddress={otherParticipant}
              isConnected={isConnected}
              onMessageSent={handleMessageSent}
              hasMessages={activeMessages.length > 0}
            />
          </div>
        </div>
      </AppLayout>
      <NewConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
      />
    </>
  );
}

export function PlaygroundPage() {
  const playgroundHandlers = usePlaygroundConversations();

  // Provide handlers to context so useMessageEventHandler can access them
  // The handler is mounted at App level but will use these handlers when available
  return (
    <PlaygroundHandlersProvider
      handlers={{
        conversations: playgroundHandlers.conversations,
        messagesByConversation: playgroundHandlers.messagesByConversation,
        updateMessageStatus: playgroundHandlers.updateMessageStatus,
        addMessage: playgroundHandlers.addMessage,
        createConversation: playgroundHandlers.createConversation,
        updateConversationId: playgroundHandlers.updateConversationId,
      }}
    >
      <PlaygroundPageContent handlers={playgroundHandlers} />
    </PlaygroundHandlersProvider>
  );
}



