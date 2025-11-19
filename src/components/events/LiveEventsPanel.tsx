import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useEkkoSocketContext } from '@/contexts/EkkoSocketContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Pause, Play, Trash2 } from 'lucide-react';
import type { MessageEvent, EventEntry } from '@/types/api';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const MAX_EVENTS = 200;

function getStatusFromEventType(eventType: string): EventEntry['status'] {
  if (eventType === 'message.queued') return 'queued';
  if (eventType === 'message.sent') return 'sent';
  if (eventType === 'message.delivered') return 'delivered';
  if (eventType === 'message.failed') return 'failed';
  return 'unknown';
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
}

function getStatusBadgeVariant(status: EventEntry['status']) {
  switch (status) {
    case 'queued':
      return 'secondary';
    case 'sent':
      return 'default';
    case 'delivered':
      return 'default';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getStatusBadgeColor(status: EventEntry['status']) {
  switch (status) {
    case 'queued':
      return 'bg-muted text-muted-foreground';
    case 'sent':
      return '';
    case 'delivered':
      return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
    case 'failed':
      return '';
    default:
      return '';
  }
}

interface LiveEventsPanelProps {}

export interface LiveEventsPanelRef {
  addTestEvent: (eventType: string) => void;
}

export const LiveEventsPanel = forwardRef<LiveEventsPanelRef, LiveEventsPanelProps>(
  function LiveEventsPanel(_, ref) {
  const { isConnected, isReady, events } = useEkkoSocketContext();
  const [eventEntries, setEventEntries] = useState<EventEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  const bufferedEventsRef = useRef<EventEntry[]>([]);

  // Determine connection status
  const connectionStatus = isConnected 
    ? { text: 'Connected', color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' }
    : isReady 
    ? { text: 'Reconnecting…', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' }
    : { text: 'Disconnected', color: 'bg-muted text-muted-foreground' };

  // Process WebSocket events into EventEntry format
  useEffect(() => {
    // Process new events that haven't been seen yet
    const newEntries: EventEntry[] = [];
    
    events.forEach((event: MessageEvent, index: number) => {
      const eventId = `${event.timestamp}-${event.type}-${(event.payload as any)?.messageId || index}`;
      
      // Skip if already processed
      if (processedEventIdsRef.current.has(eventId)) {
        return;
      }
      
      processedEventIdsRef.current.add(eventId);
      const payload = event.payload as any;
      
      // Extract safe fields only (no PHI) - explicitly ignore content fields
      const { subject, textBody, htmlBody, body, text, html, ...safePayload } = payload || {};
      
      const entry: EventEntry = {
        id: eventId,
        timestamp: new Date(event.timestamp).getTime(),
        eventType: event.type,
        messageId: safePayload?.messageId,
        conversationId: safePayload?.conversationId,
        status: getStatusFromEventType(event.type),
        chosenChannel: safePayload?.chosenChannel,
        source: 'websocket',
        payload: safePayload, // Store for future extensibility, not rendered
      };

      newEntries.push(entry);
    });

    if (newEntries.length > 0) {
      if (isPaused) {
        // Buffer events when paused
        bufferedEventsRef.current = [...bufferedEventsRef.current, ...newEntries];
      } else {
        // Update UI when not paused
        setEventEntries((prev) => {
          const updated = [...prev, ...newEntries];
          // Keep only last MAX_EVENTS
          if (updated.length > MAX_EVENTS) {
            const toRemove = updated.length - MAX_EVENTS;
            // Remove oldest processed IDs
            updated.slice(0, toRemove).forEach((entry) => {
              processedEventIdsRef.current.delete(entry.id);
            });
            return updated.slice(toRemove);
          }
          return updated;
        });
        shouldAutoScrollRef.current = true;
      }
    }
  }, [events, isPaused]);

  // Auto-scroll to bottom when new events arrive (unless paused)
  useEffect(() => {
    if (!isPaused && shouldAutoScrollRef.current && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [eventEntries, isPaused]);

  const handlePauseToggle = (checked: boolean) => {
    setIsPaused(checked);
    if (!checked) {
      // When unpausing, add buffered events and jump to latest
      if (bufferedEventsRef.current.length > 0) {
        setEventEntries((prev) => {
          const updated = [...prev, ...bufferedEventsRef.current];
          bufferedEventsRef.current = [];
          // Keep only last MAX_EVENTS
          if (updated.length > MAX_EVENTS) {
            const toRemove = updated.length - MAX_EVENTS;
            updated.slice(0, toRemove).forEach((entry) => {
              processedEventIdsRef.current.delete(entry.id);
            });
            return updated.slice(toRemove);
          }
          return updated;
        });
      }
      shouldAutoScrollRef.current = true;
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }, 0);
    }
  };

  const handleClear = () => {
    setEventEntries([]);
    shouldAutoScrollRef.current = true;
  };

  const handleCopyMessageId = (messageId: string) => {
    navigator.clipboard.writeText(messageId);
    toast.success('Message ID copied to clipboard');
  };

  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        // If user scrolls up, disable auto-scroll
        shouldAutoScrollRef.current = scrollTop + clientHeight >= scrollHeight - 10;
      }
    }
  };

  const addTestEvent = (eventType: string) => {
    const now = Date.now();
    const eventId = `test-${now}-${eventType}`;
    
    const testEntry: EventEntry = {
      id: eventId,
      timestamp: now,
      eventType: eventType,
      messageId: 'test-message-id',
      conversationId: 'test-conversation-id',
      status: getStatusFromEventType(eventType),
      chosenChannel: 'secure_email',
      source: 'websocket',
    };

    if (isPaused) {
      bufferedEventsRef.current = [...bufferedEventsRef.current, testEntry];
    } else {
      setEventEntries((prev) => {
        const updated = [...prev, testEntry];
        if (updated.length > MAX_EVENTS) {
          const toRemove = updated.length - MAX_EVENTS;
          updated.slice(0, toRemove).forEach((entry) => {
            processedEventIdsRef.current.delete(entry.id);
          });
          return updated.slice(toRemove);
        }
        return updated;
      });
      shouldAutoScrollRef.current = true;
    }
  };

  useImperativeHandle(ref, () => ({
    addTestEvent,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Events</CardTitle>
            <CardDescription>Streaming events from the Ekko WebSocket connection</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={connectionStatus.color}>
              {connectionStatus.text}
            </Badge>
            <div className="flex items-center gap-2">
              {isPaused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <Switch
                id="pause-events"
                checked={isPaused}
                onCheckedChange={handlePauseToggle}
              />
              <Label htmlFor="pause-events" className="text-sm text-muted-foreground">
                {isPaused ? 'Paused' : 'Live'}
              </Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={eventEntries.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea 
          className="h-[300px] w-full rounded-md border"
          ref={scrollAreaRef}
          onScrollCapture={handleScroll}
        >
          {eventEntries.length === 0 ? (
            <div className="flex items-center justify-center h-full p-8 text-sm text-muted-foreground">
              No events yet. Events will appear here as they are received.
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {eventEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 text-sm"
                >
                  <span className="text-muted-foreground font-mono text-xs w-20">
                    {formatTime(entry.timestamp)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {entry.eventType}
                  </Badge>
                  {entry.messageId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleCopyMessageId(entry.messageId!)}
                            className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="h-3 w-3" />
                            {entry.messageId.substring(0, 8)}...
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{entry.messageId}</p>
                          <p className="text-xs">Click to copy</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Badge 
                    variant={getStatusBadgeVariant(entry.status)}
                    className={`text-xs ${getStatusBadgeColor(entry.status)}`}
                  >
                    {entry.status}
                  </Badge>
                  {entry.chosenChannel && (
                    <span className="text-xs text-muted-foreground">
                      {entry.chosenChannel}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
  }
);

