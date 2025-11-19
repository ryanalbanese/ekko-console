import { useState } from 'react';
import { getMessageById } from '../../utils/apiClient';
import type { Message } from '../../types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

interface MessageInspectorProps {
  messages: Message[];
}

export function MessageInspector({ messages }: MessageInspectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messageId, setMessageId] = useState('');
  const [messageData, setMessageData] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!messageId.trim()) {
      setError('Please enter a message ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessageData(null);

    try {
      const data = await getMessageById(messageId.trim());
      setMessageData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch message'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMessage = (msg: Message) => {
    setMessageId(msg.messageId);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-24 z-20"
        variant="outline"
        size="sm"
      >
        Inspector
      </Button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 border-l bg-background shadow-xl z-30 overflow-y-auto">
      <Card className="border-0 rounded-none h-full flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Message Inspector</CardTitle>
              <CardDescription>Look up message details by ID</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message-id">Message ID</Label>
            <div className="flex gap-2">
              <Input
                id="message-id"
                type="text"
                value={messageId}
                onChange={(e) => setMessageId(e.target.value)}
                placeholder="Paste message ID"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLookup();
                  }
                }}
              />
              <Button
                onClick={handleLookup}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Lookup'}
              </Button>
            </div>
          </div>

          {messages.length > 0 && (
            <div className="space-y-2">
              <Label>Recent Messages</Label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {messages.slice(-10).reverse().map((msg, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    onClick={() => handleSelectMessage(msg)}
                    className="w-full justify-start text-xs font-mono truncate"
                    title={msg.messageId}
                  >
                    {msg.messageId.substring(0, 30)}...
                  </Button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          {messageData && (
            <Tabs defaultValue="status" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>
              <TabsContent value="status" className="mt-4">
                <Textarea
                  readOnly
                  value={JSON.stringify(messageData, null, 2)}
                  className="font-mono text-xs min-h-[300px]"
                />
              </TabsContent>
              <TabsContent value="content" className="mt-4">
                <Textarea
                  readOnly
                  value={JSON.stringify(messageData, null, 2)}
                  className="font-mono text-xs min-h-[300px]"
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

