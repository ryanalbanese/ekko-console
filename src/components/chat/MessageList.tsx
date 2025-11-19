import { useEffect, useRef } from 'react';
import type { Message } from '../../types/api';
import { formatTime } from '../../utils/time';
import { Badge } from '@/components/ui/badge';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  typingUser?: string | null;
}

export function MessageList({ messages, typingUser }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

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

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 min-h-full">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start a conversation!</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.messageId}-${index}`}
            className={`flex ${message.isLocal ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                message.isLocal
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {message.subject && (
                <div className="font-semibold mb-1.5 text-sm opacity-90">
                  {message.subject}
                </div>
              )}
              <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {message.body}
              </div>

              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.attachments.map((attachment, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-2 bg-background/50"
                    >
                      {attachment.preview ? (
                        <img
                          src={attachment.preview}
                          alt={attachment.metadata.filename}
                          className="max-w-full h-auto rounded"
                        />
                      ) : (
                        <div className="text-sm">
                          <div className="font-medium">{attachment.metadata.filename}</div>
                          <div className="text-xs opacity-70">
                            {(attachment.metadata.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {message.error && (
                <div className="mt-2 text-xs text-destructive">
                  Error: {message.error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-2 text-xs opacity-70">
                <span>{formatTime(message.timestamp)}</span>
                {message.isLocal && getStatusBadge(message.status)}
              </div>
            </div>
          </div>
        ))}

        {typingUser && <TypingIndicator userName={typingUser} />}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

