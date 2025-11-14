import { useEffect, useRef } from 'react';
import type { Message } from '../types/api';
import { formatTimestamp, formatTime } from '../utils/time';

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

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'delivered':
        return '✓✓';
      case 'sent':
        return '✓';
      case 'failed':
        return '✗';
      case 'queued':
        return '⏳';
      default:
        return '';
    }
  };

  const getStatusColor = (status: Message['status']) => {
    switch (status) {
      case 'delivered':
        return 'text-blue-500';
      case 'sent':
        return 'text-gray-500';
      case 'failed':
        return 'text-red-500';
      case 'queued':
        return 'text-yellow-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <p>No messages yet. Start a conversation!</p>
        </div>
      )}

      {messages.map((message, index) => (
        <div
          key={`${message.messageId}-${index}`}
          className={`flex ${message.isLocal ? 'justify-end' : 'justify-start'} animate-fade-in`}
        >
          <div
            className={`max-w-[70%] rounded-lg px-4 py-2 shadow-chat dark:shadow-chat-dark ${
              message.isLocal
                ? 'bg-chat-message-user-light dark:bg-chat-message-user-dark text-white'
                : 'bg-chat-message-assistant-light dark:bg-chat-message-assistant-dark text-chat-text-primary-light dark:text-chat-text-primary-dark'
            }`}
          >
            {message.subject && (
              <div className="font-semibold mb-1 text-sm">{message.subject}</div>
            )}
            <div className="whitespace-pre-wrap break-words">{message.body}</div>

            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700"
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
                        <div className="text-xs text-gray-500">
                          {(attachment.metadata.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {message.error && (
              <div className="mt-2 text-xs text-red-400 dark:text-red-300">
                Error: {message.error}
              </div>
            )}

            <div
              className={`flex items-center gap-2 mt-2 text-xs ${
                message.isLocal
                  ? 'text-white/70'
                  : 'text-chat-text-secondary-light dark:text-chat-text-secondary-dark'
              }`}
            >
              <span>{formatTime(message.timestamp)}</span>
              {message.status !== 'pending' && (
                <span className={getStatusColor(message.status)}>
                  {getStatusIcon(message.status)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {typingUser && (
        <div className="flex justify-start">
          <div className="bg-chat-message-assistant-light dark:bg-chat-message-assistant-dark rounded-lg px-4 py-2 shadow-chat dark:shadow-chat-dark">
            <div className="flex items-center gap-2 text-sm text-chat-text-secondary-light dark:text-chat-text-secondary-dark">
              <span>{typingUser} is typing</span>
              <div className="flex gap-1">
                <div
                  className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}


