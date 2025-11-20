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

  const headerActions = hasConversations ? (
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
  ) : undefined;

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



