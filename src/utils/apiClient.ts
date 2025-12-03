import axios, { AxiosInstance, AxiosError } from 'axios';
import { getCurrentToken } from './auth';
import type {
  SendMessageRequestDto,
  SendMessageResponseDto,
  WebhookEndpoint,
  CreateWebhookEndpointRequest,
  EkkoChannelsResponse,
  BootstrapResponse,
} from '../types/api';

const API_URL = import.meta.env.VITE_EKKO_API_URL || 'http://localhost:8080';

/**
 * Create Axios instance with base configuration
 * Authorization header is set dynamically per request
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getCurrentToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // In demo mode, this is an error
      if (import.meta.env.VITE_EKKO_DEMO_MODE === 'true') {
        console.error('No auth token available in demo mode');
      }
      // In real mode, the app should show login screen
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized: Invalid or missing token');
    }
    return Promise.reject(error);
  }
);

/**
 * Send a message via POST /v1/message
 */
export async function sendMessage(
  request: SendMessageRequestDto
): Promise<SendMessageResponseDto> {
  const token = getCurrentToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await apiClient.post<SendMessageResponseDto>(
    '/v1/message',
    request
  );
  return response.data;
}

/**
 * Get message by ID via GET /v1/message/{messageId}
 */
export async function getMessageById(
  messageId: string
): Promise<unknown> {
  const token = getCurrentToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await apiClient.get(`/v1/message/${messageId}`);
  return response.data;
}

/**
 * Get message content by ID via GET /v1/message/{messageId}/content
 */
export async function getMessageContentById(
  messageId: string
): Promise<unknown> {
  const token = getCurrentToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await apiClient.get(`/v1/message/${messageId}/content`);
  return response.data;
}

/**
 * Get message channels via GET /v1/message/channels
 */
export async function getMessageChannels(): Promise<EkkoChannelsResponse> {
  const token = getCurrentToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await apiClient.get<EkkoChannelsResponse>('/v1/message/channels');
  return response.data;
}

/**
 * Get bootstrap data via GET /v1/console/bootstrap
 * PHI-free endpoint that returns project configuration, channels, and demo identities
 * @param token Optional token to use. If not provided, will use getCurrentToken()
 */
export async function getBootstrapData(token?: string): Promise<BootstrapResponse> {
  const authToken = token || getCurrentToken();
  if (!authToken) {
    throw new Error('No authentication token available');
  }

  // Create a one-time axios instance with the provided token if needed
  const client = token 
    ? axios.create({
        baseURL: API_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
    : apiClient;

  const response = await client.get<BootstrapResponse>('/v1/console/bootstrap');
  return response.data;
}

/**
 * Get webhook endpoints via GET /v1/webhooks/endpoints
 */
export async function getWebhookEndpoints(): Promise<WebhookEndpoint[]> {
  const token = getCurrentToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await apiClient.get<WebhookEndpoint[]>('/v1/webhooks/endpoints');
  return response.data;
}

/**
 * Create webhook endpoint via POST /v1/webhooks/endpoints
 */
export async function createWebhookEndpoint(
  dto: CreateWebhookEndpointRequest
): Promise<{ id: string }> {
  const token = getCurrentToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await apiClient.post<{ id: string }>('/v1/webhooks/endpoints', dto);
  return response.data;
}

/**
 * Delete webhook endpoint via DELETE /v1/webhooks/endpoints/:id
 */
export async function deleteWebhookEndpoint(id: string): Promise<void> {
  const token = getCurrentToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  await apiClient.delete(`/v1/webhooks/endpoints/${id}`);
}

/**
 * Test webhook via POST /v1/webhooks/test
 * Note: Currently sends to all endpoints for the organization.
 * Backend needs update to support per-endpoint testing via endpointId parameter.
 */
export async function testWebhook(
  endpointId: string,
  eventType?: string
): Promise<{ message: string }> {
  const token = getCurrentToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  // Backend currently only accepts eventType, sends to all endpoints
  const response = await apiClient.post<{ message: string }>('/v1/webhooks/test', {
    eventType: eventType || 'message.sent',
  });
  return response.data;
}

export default apiClient;


