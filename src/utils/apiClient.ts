import axios, { AxiosInstance, AxiosError } from 'axios';
import { getCurrentToken } from './auth';
import type {
  SendMessageRequestDto,
  SendMessageResponseDto,
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

export default apiClient;


