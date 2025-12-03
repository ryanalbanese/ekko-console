import { useState, useRef, FormEvent, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import TextareaAutosize from 'react-textarea-autosize';
import { ArrowUpIcon } from 'lucide-react';
import { IconPlus } from '@tabler/icons-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { sendMessage } from '@/utils/apiClient';
import { storeMessage } from '@/utils/messageStorage';
import { getSelectedIdentity } from '@/utils/auth';
import type { Message } from '@/types/api';

interface PlaygroundComposerProps {
  activeConversationId: string | null;
  recipientAddress: string | null;
  isConnected: boolean;
  onMessageSent: (message: Message) => void;
  hasMessages: boolean;
}

export function PlaygroundComposer({
  activeConversationId,
  recipientAddress,
  isConnected,
  onMessageSent,
  hasMessages,
}: PlaygroundComposerProps) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [channel, setChannel] = useState<'auto' | 'secure_email' | 'sms' | 'xmpp' | 'ai'>('auto');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = activeConversationId && recipientAddress && text.trim() && isConnected && !isSending;

  const handleSubmit = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!canSend || !activeConversationId || !recipientAddress) {
      return;
    }

    setIsSending(true);

    try {
      // Generate a unique request ID to avoid idempotency collisions
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Use selected identity as default from address
      const selectedIdentity = getSelectedIdentity();
      const fromAddress = selectedIdentity
        ? { address: selectedIdentity.address, name: selectedIdentity.name }
        : undefined;
      
      const response = await sendMessage({
        to: [{ address: recipientAddress }],
        from: fromAddress,
        channel: channel,
        content: { text: text.trim() },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      });

      // Create optimistic message
      const optimisticMessage: Message = {
        messageId: response.messageId,
        conversationId: response.conversationId,
        body: text.trim(),
        recipients: [{ email: recipientAddress, type: 'TO' }],
        status: 'queued',
        timestamp: new Date().toISOString(),
        isLocal: true,
        from: fromAddress, // Set from field so message is recognized as outbound
      };

      // Store message metadata in localStorage
      storeMessage({
        messageId: response.messageId,
        conversationId: response.conversationId,
        timestamp: Date.now(),
        chosenChannel: response.chosenChannel,
        lastKnownStatus: 'queued',
        source: 'playground',
      });

      onMessageSent(optimisticMessage);
      setText('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error to user
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        handleSubmit();
      }
    }
  };

  return (
    <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <form onSubmit={handleSubmit}>
          <InputGroup>
            <TextareaAutosize
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              disabled={!activeConversationId || isSending}
              className="flex field-sizing-content min-h-16 w-full resize-none rounded-none border-0 bg-transparent px-3 py-3 text-base transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
              data-slot="input-group-control"
            />
            <InputGroupAddon align="block-end">
              <InputGroupButton
                variant="outline"
                className="rounded-full"
                size="icon-xs"
                type="button"
                disabled
              >
                <IconPlus />
              </InputGroupButton>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <InputGroupButton 
                    variant="ghost" 
                    type="button"
                  >
                    {channel.charAt(0).toUpperCase() + channel.slice(1)}
                  </InputGroupButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="[--radius:0.95rem]"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  sideOffset={8}
                  collisionPadding={16}
                  avoidCollisions={true}
                >
                  <DropdownMenuItem onSelect={() => setChannel('auto')}>
                    Auto
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setChannel('secure_email')}>
                    Secure Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setChannel('sms')}>
                    SMS
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setChannel('xmpp')}>
                    XMPP
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setChannel('ai')}>
                    AI
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {recipientAddress && (
                <InputGroupText className="ml-auto">Sending to {recipientAddress}</InputGroupText>
              )}
              <Separator orientation="vertical" className="!h-4" />
              <InputGroupButton
                variant="default"
                className="rounded-full"
                size="icon-xs"
                type="submit"
                disabled={!canSend}
              >
                <ArrowUpIcon />
                <span className="sr-only">Send</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {hasMessages ? (
            <p className="mt-2 text-xs text-center text-muted-foreground">
              For detailed message logs and message content, use{' '}
              <Link to="/messages" className="underline hover:text-foreground">
                Message Explorer
              </Link>{' '}
              in the sidebar.
            </p>
          ) : (
            <p className="mt-2 text-xs text-center text-muted-foreground">
              Press Enter to send. Shift + Enter for a new line.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

