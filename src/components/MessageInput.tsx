import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import { sendMessage } from '../utils/apiClient';
import { useEkkoSocket } from '../hooks/useEkkoSocket';
import type { Attachment, Message } from '../types/api';

interface MessageInputProps {
  addMessage: (message: Omit<Message, 'timestamp' | 'status'>) => void;
  conversationId: string | null;
}

export function MessageInput({ addMessage, conversationId }: MessageInputProps) {
  const [text, setText] = useState('');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const { emitTypingStart, emitTypingStop, isConnected } = useEkkoSocket();

  // Debounced typing detection
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.trim() && isConnected) {
      emitTypingStart();
      typingTimeoutRef.current = window.setTimeout(() => {
        emitTypingStop();
      }, 2000);
    } else if (isConnected) {
      emitTypingStop();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [text, isConnected, emitTypingStart, emitTypingStop]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const attachment: Attachment = {
        file,
        metadata: {
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        },
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          attachment.preview = event.target?.result as string;
          setAttachments((prev) => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachments((prev) => [...prev, attachment]);
      }
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const convertAttachmentsToDto = async (): Promise<Array<{
    filename: string;
    contentType?: string;
    data: string;
    size?: number;
  }>> => {
    const promises = attachments.map(async (attachment) => {
      return new Promise<{
        filename: string;
        contentType?: string;
        data: string;
        size?: number;
      }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:image/png;base64,")
          const base64 = result.split(',')[1] || result;
          resolve({
            filename: attachment.metadata.filename,
            contentType: attachment.metadata.mimeType || undefined,
            data: base64,
            size: attachment.metadata.size,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(attachment.file);
      });
    });

    return Promise.all(promises);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!text.trim() && attachments.length === 0) {
      return;
    }

    if (!recipient.trim()) {
      setError('Recipient email is required');
      return;
    }

    if (!isConnected) {
      setError('Not connected to server');
      return;
    }

    setIsSending(true);

    try {
      const attachmentList = await convertAttachmentsToDto();

      // Build content object - at least one of text or html must be present
      const content: { subject?: string; text?: string; html?: string } = {
        ...(subject.trim() && { subject: subject.trim() }),
      };
      
      const messageText = text.trim() || '(No message text)';
      // For now, always use text (plain text). Can add HTML support later if needed.
      content.text = messageText;

      // Build conversation object if we have a conversationId
      const conversation = conversationId
        ? {
            id: conversationId,
            mode: 'reply' as const,
          }
        : undefined;

      const response = await sendMessage({
        to: [{ address: recipient.trim() }],
        content,
        ...(attachmentList.length > 0 && { attachments: attachmentList }),
        ...(conversation && { conversation }),
        // Default to auto channel detection
        channel: 'auto',
      });

      // Add message optimistically
      addMessage({
        messageId: response.messageId,
        conversationId: response.conversationId,
        body: text.trim() || '(No message text)',
        subject: subject.trim() || undefined,
        recipients: [{ email: recipient.trim(), type: 'TO' }],
        isLocal: true,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // Clear form
      setText('');
      setSubject('');
      setAttachments([]);
      emitTypingStop();
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to send message. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="relative inline-block border border-gray-300 dark:border-gray-600 rounded p-2 bg-gray-50 dark:bg-gray-700"
              >
                {attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.metadata.filename}
                    className="h-20 w-auto rounded"
                  />
                ) : (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {attachment.metadata.filename}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Recipient email"
              required
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (optional)"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                📎
              </button>
              <button
                type="submit"
                disabled={isSending || !isConnected}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </form>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}

