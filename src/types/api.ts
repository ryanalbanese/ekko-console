// API Request/Response Types
export interface RecipientDto {
  email: string;
  type: 'TO' | 'CC' | 'BCC';
}

export interface AttachmentDto {
  content: string; // Base64 encoded
  contentType: string;
  filename: string;
  transferEncoding?: 'base64';
}

export interface MessageDto {
  msgID?: string;
  sender?: string;
  subject?: string;
  body: string;
  htmlBody: boolean;
  recipients: RecipientDto[];
  headers?: Array<{ name: string; value: string }>;
  attachmentList?: AttachmentDto[];
}

export interface RecipientAddressDto {
  address: string;
  name?: string;
}

export interface MessageContentDto {
  subject?: string;
  text?: string;
  html?: string;
}

export interface ConversationDto {
  id?: string;
  hint?: string;
  mode?: 'auto' | 'new' | 'reply';
}

export interface AttachmentDataDto {
  filename: string;
  contentType?: string;
  data: string; // Base64 encoded
  size?: number;
}

export interface SendMessageRequestDto {
  to: RecipientAddressDto[];
  cc?: RecipientAddressDto[];
  bcc?: RecipientAddressDto[];
  from?: RecipientAddressDto;
  channel?: 'auto' | 'secure_email' | 'sms' | 'xmpp' | 'ai';
  conversation?: ConversationDto;
  content: MessageContentDto;
  attachments?: AttachmentDataDto[];
  metadata?: Record<string, unknown>;
}

export interface SendMessageResponseDto {
  messageId: string;
  conversationId: string;
  chosenChannel: string;
  projectId?: string;
  orgId?: string;
  threadToken?: string;
}

// WebSocket Event Types
export interface MessageQueuedEvent {
  messageId: string;
  conversationId: string;
  chosenChannel: string;
  timestamp: string;
  requestId: string;
}

export interface MessageSentEvent {
  messageId: string;
  conversationId: string;
  chosenChannel: string;
  timestamp: string;
  providerId: string;
  requestId: string;
}

export interface MessageDeliveredEvent {
  messageId: string;
  conversationId: string;
  chosenChannel: string;
  timestamp: string;
  providerId: string;
  requestId: string;
}

export interface MessageFailedEvent {
  messageId: string;
  conversationId: string;
  chosenChannel: string;
  timestamp: string;
  error: string;
  isRetryable: boolean;
  requestId: string;
}

export interface TypingStartedEvent {
  userId?: string;
  conversationId?: string;
  timestamp: string;
}

export interface TypingStoppedEvent {
  userId?: string;
  conversationId?: string;
  timestamp: string;
}

export type MessageEventType =
  | 'message.queued'
  | 'message.sent'
  | 'message.delivered'
  | 'message.failed'
  | 'typing.started'
  | 'typing.stopped';

export type MessageEventPayload =
  | MessageQueuedEvent
  | MessageSentEvent
  | MessageDeliveredEvent
  | MessageFailedEvent
  | TypingStartedEvent
  | TypingStoppedEvent;

export interface MessageEvent {
  type: MessageEventType;
  payload: MessageEventPayload;
  timestamp: string;
}

// Internal Types
export interface Attachment {
  file: File;
  preview?: string;
  metadata: {
    filename: string;
    mimeType: string;
    size: number;
  };
}

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'pending';

export interface Message {
  messageId: string;
  conversationId: string;
  body: string;
  subject?: string;
  sender?: string;
  recipients: RecipientDto[];
  status: MessageStatus;
  timestamp: string;
  isLocal: boolean;
  attachments?: Attachment[];
  error?: string;
  isRetryable?: boolean;
}

export interface Conversation {
  conversationId: string;
  messages: Message[];
  lastUpdated: string;
}

export type StoredMessage = {
  messageId: string;
  conversationId: string;
  timestamp: number;
  chosenChannel: string;
  lastKnownStatus?: "queued" | "sent" | "delivered" | "failed";
  source?: string;
};

// Webhook Types
export interface WebhookEndpoint {
  id: string;
  url: string;
  eventTypes: string[];
  createdAt: string;
  expiresAt: string;
}

export interface CreateWebhookEndpointRequest {
  url: string;
  eventTypes: string[];
  secret?: string;
}

// Channel Capabilities Types
export interface ChannelCapability {
  channel: 'secure_email' | 'sms' | 'xmpp' | 'ai' | string;
  name: string;
  supportsThreading: boolean;
  supportsAttachments: boolean;
  maxRecipients: number;
  rateLimit: {
    perMinute: number;
  };
}

export interface EkkoChannelsResponse {
  capabilities: ChannelCapability[];
  capabilities_version: string;
  generated_at: string;
}

// Event Entry for Live Events Panel
export interface EventEntry {
  id: string;
  timestamp: number;
  eventType: string;
  messageId?: string;
  conversationId?: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'unknown';
  chosenChannel?: string;
  source: 'websocket';
  payload?: unknown; // For future extensibility, not rendered
}

