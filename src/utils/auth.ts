/**
 * Centralized authentication token provider
 * Single source of truth for auth tokens used by REST and WebSocket clients
 */

const DEMO_MODE = import.meta.env.VITE_EKKO_DEMO_MODE === 'true';
const DEMO_TOKEN = import.meta.env.VITE_EKKO_AUTH_TOKEN;
const DEMO_IDENTITY = import.meta.env.VITE_EKKO_IDENTITY_LABEL;

const STORAGE_KEY_TOKEN = 'ekkoApiKey';
const STORAGE_KEY_IDENTITY = 'ekkoIdentityLabel';
const STORAGE_KEY_BOOTSTRAP = 'ekkoBootstrap';

// Token change listeners for reactive updates
const tokenChangeListeners = new Set<() => void>();

/**
 * Get the current authentication token
 * @returns Current token or null if not available
 */
export function getCurrentToken(): string | null {
  if (DEMO_MODE) {
    if (!DEMO_TOKEN) {
      console.error('Demo mode enabled but VITE_EKKO_AUTH_TOKEN is not set');
      return null;
    }
    // Validate demo token format
    if (!DEMO_TOKEN.startsWith('ekko_')) {
      console.error('Demo token does not start with "ekko_". Please check VITE_EKKO_AUTH_TOKEN environment variable.');
      return null;
    }
    return DEMO_TOKEN;
  }

  // Real mode: get from localStorage
  // Removed client-side ekko_ prefix validation (let backend validate)
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  return token || null;
}

/**
 * Set the authentication token (only works in non-demo mode)
 * @param token The token to store
 */
export function setToken(token: string): void {
  if (DEMO_MODE) {
    console.warn('Cannot set token in demo mode. Token comes from environment variable.');
    return;
  }

  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  notifyTokenChange();
}

/**
 * Clear the authentication token (only works in non-demo mode)
 */
export function clearToken(): void {
  if (DEMO_MODE) {
    console.warn('Cannot clear token in demo mode.');
    return;
  }

  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_IDENTITY);
  notifyTokenChange();
}

/**
 * Check if we're in demo mode
 */
export function isDemoMode(): boolean {
  return DEMO_MODE;
}

/**
 * Get the identity label for display
 */
export function getIdentityLabel(): string {
  if (DEMO_MODE) {
    return DEMO_IDENTITY || 'Demo User';
  }

  const stored = localStorage.getItem(STORAGE_KEY_IDENTITY);
  return stored || 'You';
}

/**
 * Set the identity label (only works in non-demo mode)
 */
export function setIdentityLabel(label: string): void {
  if (DEMO_MODE) {
    console.warn('Cannot set identity label in demo mode. Use VITE_EKKO_IDENTITY_LABEL env var.');
    return;
  }

  localStorage.setItem(STORAGE_KEY_IDENTITY, label);
}

/**
 * Subscribe to token changes
 */
export function onTokenChange(callback: () => void): () => void {
  tokenChangeListeners.add(callback);
  return () => {
    tokenChangeListeners.delete(callback);
  };
}

/**
 * Notify all listeners of token change
 */
function notifyTokenChange(): void {
  tokenChangeListeners.forEach((callback) => callback());
}

/**
 * Check if a token is available
 */
export function hasToken(): boolean {
  return getCurrentToken() !== null;
}

/**
 * Bootstrap data storage functions
 */
import type { BootstrapResponse, BootstrapIdentity } from '../types/api';

const STORAGE_KEY_SELECTED_IDENTITY = 'ekkoSelectedIdentity';

/**
 * Store bootstrap data in localStorage
 */
export function setBootstrapData(data: BootstrapResponse): void {
  if (DEMO_MODE) {
    console.warn('Cannot set bootstrap data in demo mode.');
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY_BOOTSTRAP, JSON.stringify(data));
    
    // Preselect defaultFrom if present, else first identity
    const selectedIdentity = data.defaultFrom || data.identities.from[0];
    if (selectedIdentity) {
      setSelectedIdentity(selectedIdentity);
    }
  } catch (error) {
    console.error('Failed to store bootstrap data:', error);
  }
}

/**
 * Get bootstrap data from localStorage
 */
export function getBootstrapData(): BootstrapResponse | null {
  if (DEMO_MODE) {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY_BOOTSTRAP);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as BootstrapResponse;
  } catch (error) {
    console.error('Failed to parse bootstrap data:', error);
    return null;
  }
}

/**
 * Clear bootstrap data from localStorage
 */
export function clearBootstrapData(): void {
  if (DEMO_MODE) {
    console.warn('Cannot clear bootstrap data in demo mode.');
    return;
  }

  localStorage.removeItem(STORAGE_KEY_BOOTSTRAP);
  localStorage.removeItem(STORAGE_KEY_SELECTED_IDENTITY);
}

/**
 * Clear all storage (token, identity, bootstrap) - used when bootstrap is missing/corrupt
 */
export function clearAllStorage(): void {
  if (DEMO_MODE) {
    console.warn('Cannot clear storage in demo mode.');
    return;
  }

  clearToken();
  clearBootstrapData();
}

/**
 * Get selected identity from localStorage
 */
export function getSelectedIdentity(): BootstrapIdentity | null {
  if (DEMO_MODE) {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY_SELECTED_IDENTITY);
    if (!stored) {
      // Fallback to bootstrap defaultFrom or first identity
      const bootstrap = getBootstrapData();
      if (bootstrap) {
        const identity = bootstrap.defaultFrom || bootstrap.identities.from[0];
        if (identity) {
          setSelectedIdentity(identity);
          return identity;
        }
      }
      return null;
    }
    return JSON.parse(stored) as BootstrapIdentity;
  } catch (error) {
    console.error('Failed to parse selected identity:', error);
    return null;
  }
}

/**
 * Set selected identity in localStorage
 */
export function setSelectedIdentity(identity: BootstrapIdentity): void {
  if (DEMO_MODE) {
    console.warn('Cannot set selected identity in demo mode.');
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY_SELECTED_IDENTITY, JSON.stringify(identity));
  } catch (error) {
    console.error('Failed to store selected identity:', error);
  }
}


