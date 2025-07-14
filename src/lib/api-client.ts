/**
 * Utility functions for making authenticated API requests
 */

import { debug } from '@/lib/debug-system';
import browserCompatibility from '@/lib/browser-compatibility';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Enhanced fetch with Opera browser compatibility
 */
async function operaCompatibleFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const startTime = performance.now();
  
  try {
    debug.debug('api-client', 'operaCompatibleFetch', 'Starting Opera-compatible fetch', {
      url,
      method: options.method || 'GET'
    });
    
    // Use regular fetch - Opera polyfills are applied automatically by browserCompatibility
    const response = await fetch(url, {
      ...options,
      // Opera-specific timeout handling
      signal: options.signal || AbortSignal.timeout(30000),
    });
    
    const duration = performance.now() - startTime;
    debug.debug('api-client', 'operaCompatibleFetch', 'Opera-compatible fetch completed', {
      url,
      status: response.status,
      duration: `${duration.toFixed(2)}ms`
    });
    
    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    debug.error('api-client', 'operaCompatibleFetch', 'Opera-compatible fetch failed', error as Error, {
      url,
      duration: `${duration.toFixed(2)}ms`
    });
    
    // Opera-specific error handling
    if (browserCompatibility.isOpera()) {
      debug.warn('api-client', 'operaCompatibleFetch', 'Applying Opera-specific error handling', { url });
      browserCompatibility.reportCompatibilityIssue('Fetch operation failed', { url, error });
      throw new Error(`Opera fetch error: ${error instanceof Error ? error.message : 'Network error'}`);
    }
    
    throw error;
  }
}

/**
 * Get authorization headers for API requests
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    debug.debug('api-client', 'getAuthHeaders', 'Getting auth headers');
    
    // Dynamic import to prevent webpack factory errors
    const { getSupabaseClient } = await import('@/lib/supabase-singleton');
    const supabase = getSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      debug.warn('api-client', 'getAuthHeaders', 'No active session for API request');
      return {
        'Content-Type': 'application/json',
      };
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
    
    debug.debug('api-client', 'getAuthHeaders', 'Auth headers obtained successfully');
    return headers;
  } catch (error) {
    debug.error('api-client', 'getAuthHeaders', 'Error getting auth headers', error as Error);
    return {
      'Content-Type': 'application/json',
    };
  }
}

/**
 * Make an authenticated GET request
 */
export async function apiGet<T = any>(url: string): Promise<ApiResponse<T>> {
  try {
    debug.debug('api-client', 'apiGet', 'Starting GET request', { url });
    
    const headers = await getAuthHeaders();
    const response = await operaCompatibleFetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    
    const data = response.ok ? await response.json() : null;
    
    debug.debug('api-client', 'apiGet', 'GET request completed', {
      url,
      status: response.status,
      success: response.ok
    });
    
    return {
      data,
      error: response.ok ? undefined : data?.error || `Request failed with status ${response.status}`,
      status: response.status,
    };
  } catch (error) {
    debug.error('api-client', 'apiGet', `API GET error for ${url}`, error as Error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

/**
 * Make an authenticated POST request
 */
export async function apiPost<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
  try {
    debug.debug('api-client', 'apiPost', 'Starting POST request', { url, hasBody: !!body });
    
    const headers = await getAuthHeaders();
    const response = await operaCompatibleFetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = response.ok ? await response.json() : null;
    
    debug.debug('api-client', 'apiPost', 'POST request completed', {
      url,
      status: response.status,
      success: response.ok
    });
    
    return {
      data,
      error: response.ok ? undefined : data?.error || `Request failed with status ${response.status}`,
      status: response.status,
    };
  } catch (error) {
    debug.error('api-client', 'apiPost', `API POST error for ${url}`, error as Error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

/**
 * Make an authenticated PUT request
 */
export async function apiPut<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
  try {
    debug.debug('api-client', 'apiPut', 'Starting PUT request', { url, hasBody: !!body });
    
    const headers = await getAuthHeaders();
    const response = await operaCompatibleFetch(url, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = response.ok ? await response.json() : null;
    
    debug.debug('api-client', 'apiPut', 'PUT request completed', {
      url,
      status: response.status,
      success: response.ok
    });
    
    return {
      data,
      error: response.ok ? undefined : data?.error || `Request failed with status ${response.status}`,
      status: response.status,
    };
  } catch (error) {
    debug.error('api-client', 'apiPut', `API PUT error for ${url}`, error as Error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

/**
 * Make an authenticated DELETE request
 */
export async function apiDelete<T = any>(url: string): Promise<ApiResponse<T>> {
  try {
    debug.debug('api-client', 'apiDelete', 'Starting DELETE request', { url });
    
    const headers = await getAuthHeaders();
    const response = await operaCompatibleFetch(url, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    
    const data = response.ok ? await response.json() : null;
    
    debug.debug('api-client', 'apiDelete', 'DELETE request completed', {
      url,
      status: response.status,
      success: response.ok
    });
    
    return {
      data,
      error: response.ok ? undefined : data?.error || `Request failed with status ${response.status}`,
      status: response.status,
    };
  } catch (error) {
    debug.error('api-client', 'apiDelete', `API DELETE error for ${url}`, error as Error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

/**
 * Legacy fetch with auth headers (for gradual migration)
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  debug.debug('api-client', 'fetchWithAuth', 'Using legacy fetch with auth', { url, method: options.method || 'GET' });
  
  const headers = await getAuthHeaders();
  return operaCompatibleFetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
    credentials: 'include',
  });
}