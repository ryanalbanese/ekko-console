import { useEffect, useRef, useState } from 'react';
import { useEkkoSocketContext } from '@/contexts/EkkoSocketContext';
import type { MessageEvent } from '@/types/api';

export interface NormalizedMessageEvent {
  eventType: 'message.queued' | 'message.sent' | 'message.delivered' | 'message.failed';
  messageId: string;
  conversationId: string;
  chosenChannel: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  timestamp: string;
  providerId?: string;
  projectId?: string;
  orgId?: string;
  requestId?: string;
  error?: string;
  isRetryable?: boolean;
}

/**
 * Low-level hook that subscribes to WebSocket events and normalizes message.* events
 * This is the single source of truth for message events from WebSocket
 * Filters out PHI and only returns safe metadata fields
 * Returns only NEW events since last call (not accumulated)
 */
export function useMessageEvents(): NormalizedMessageEvent[] {
  const { events } = useEkkoSocketContext();
  const [normalizedEvents, setNormalizedEvents] = useState<NormalizedMessageEvent[]>([]);
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  const lastEventsLengthRef = useRef(0);

  useEffect(() => {
    // Only process new events (events that weren't there before)
    const newEvents: NormalizedMessageEvent[] = [];
    const currentEventsLength = events.length;

    // Process only events that are new since last time
    for (let i = lastEventsLengthRef.current; i < currentEventsLength; i++) {
      const event = events[i];

      // Only process message.* events
      if (!event.type.startsWith('message.')) {
        continue;
      }

      const payload = event.payload as any;
      const messageId = payload?.messageId;
      const conversationId = payload?.conversationId;

      // Skip if missing required fields
      if (!messageId || !conversationId) {
        continue;
      }

      // Create unique event ID to avoid duplicates
      const eventId = `${event.type}:${messageId}:${event.timestamp}`;

      // Skip if already processed
      if (processedEventIdsRef.current.has(eventId)) {
        continue;
      }

      processedEventIdsRef.current.add(eventId);

      // Extract only safe fields (no PHI)
      // Explicitly ignore: subject, textBody, htmlBody, body, text, html, attachment names
      const normalized: NormalizedMessageEvent = {
        eventType: event.type as NormalizedMessageEvent['eventType'],
        messageId,
        conversationId,
        chosenChannel: payload?.chosenChannel || 'unknown',
        status: getStatusFromEventType(event.type),
        timestamp: payload?.timestamp || event.timestamp,
        providerId: payload?.providerId,
        projectId: payload?.projectId,
        orgId: payload?.orgId,
        requestId: payload?.requestId,
        error: payload?.error,
        isRetryable: payload?.isRetryable,
      };

      newEvents.push(normalized);
    }

    // Update the last processed length
    lastEventsLengthRef.current = currentEventsLength;

    // Set only new events (not accumulated)
    if (newEvents.length > 0) {
      setNormalizedEvents(newEvents);
    } else {
      // Clear if no new events
      setNormalizedEvents([]);
    }
  }, [events]);

  return normalizedEvents;
}

function getStatusFromEventType(eventType: string): 'queued' | 'sent' | 'delivered' | 'failed' {
  if (eventType === 'message.queued') return 'queued';
  if (eventType === 'message.sent') return 'sent';
  if (eventType === 'message.delivered') return 'delivered';
  if (eventType === 'message.failed') return 'failed';
  return 'queued'; // fallback
}

