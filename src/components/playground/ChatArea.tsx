import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty } from '@/components/ui/empty';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/utils/time';
import type { Message } from '@/types/api';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ChatAreaProps {
  messages: Message[];
  activeConversationId: string | null;
  onClearMessages?: () => void;
}

export function ChatArea({ messages, activeConversationId, onClearMessages }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getStatusBadge = (status: Message['status']) => {
    if (status === 'pending') return null;

    const variants: Record<Message['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      queued: { label: 'Queued', variant: 'outline' },
      sent: { label: 'Sent', variant: 'secondary' },
      delivered: { label: 'Delivered', variant: 'default' },
      failed: { label: 'Failed', variant: 'destructive' },
      pending: { label: 'Pending', variant: 'outline' },
    };

    const config = variants[status];
    if (!config) return null;

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  if (!activeConversationId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Empty
          title="No conversation selected"
          description="Select a conversation on the left, or start a new conversation."
        />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Empty
          title="No messages yet"
          description="No messages yet. Send from here, a webhook, or the API to see them appear."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {messages.length > 0 && onClearMessages && (
        <div className="flex items-center justify-end px-4 py-2 border-b">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Clear Messages
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all messages?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all messages from this conversation. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearMessages}>Clear</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message, index) => (
            <div
              key={`${message.messageId}-${index}`}
              className={cn(
                'flex',
                message.isLocal ? 'justify-end' : 'justify-start'
              )}
            >
              <div className="flex flex-col max-w-[80%]">
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 shadow-sm',
                    message.isLocal
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {message.subject && (
                    <div className="font-semibold mb-1.5 text-sm opacity-90">
                      {message.subject}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.body}
                  </div>
                  {message.error && (
                    <div className="mt-2 text-xs opacity-80">
                      Error: {message.error}
                    </div>
                  )}
                </div>
                {message.isLocal && (
                  <div className="flex items-center justify-end gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatTime(message.timestamp)}</span>
                    {getStatusBadge(message.status)}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}



