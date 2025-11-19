import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import { Paperclip, Send, X, ChevronDown, ChevronUp } from 'lucide-react';
import { sendMessage } from '../../utils/apiClient';
import { useEkkoSocketContext } from '../../contexts/EkkoSocketContext';
import type { Attachment, Message } from '../../types/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { emitTypingStart, emitTypingStop, isConnected } = useEkkoSocketContext();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

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

  const handleSubmit = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setError(null);

    if (!text.trim() && attachments.length === 0) {
      return;
    }

    if (!recipient.trim()) {
      setError('Recipient email is required. Please expand "Show recipient & subject" to enter it.');
      setShowAdvanced(true);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !isSending && isConnected) {
        handleSubmit();
      }
    }
  };

  return (
    <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-3xl mx-auto px-4 py-4">
        {error && (
          <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
            {error}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="gap-1.5 pr-1"
              >
                {attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.metadata.filename}
                    className="h-6 w-auto rounded"
                  />
                ) : (
                  <span className="text-xs">{attachment.metadata.filename}</span>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mb-2 text-xs"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide advanced
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show recipient & subject
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mb-3">
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-xs">
                Recipient
              </Label>
              <Input
                id="recipient"
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="recipient@example.com"
                required
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-xs">
                Subject (optional)
              </Label>
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message subject"
                className="h-9"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message via Ekko..."
              disabled={isSending || !isConnected}
              className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent px-3 py-2.5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
            />
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending || !isConnected}
                className="h-9 w-9 rounded-full"
                aria-label="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                size="icon"
                disabled={isSending || !isConnected || (!text.trim() && attachments.length === 0)}
                className="h-9 w-9 rounded-full"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-center text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
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

