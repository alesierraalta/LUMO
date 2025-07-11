/**
 * Utility functions for making authenticated API requests
 */

import { getSupabaseClient } from '@/lib/supabase-singleton';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Get authorization headers for API requests
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      console.warn('No active session for API request');
      return {
        'Content-Type': 'application/json',
      };
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
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
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    
    const data = response.ok ? await response.json() : null;
    
    return {
      data,
      error: response.ok ? undefined : data?.error || `Request failed with status ${response.status}`,
      status: response.status,
    };
  } catch (error) {
    console.error(`API GET error for ${url}:`, error);
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
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = response.ok ? await response.json() : null;
    
    return {
      data,
      error: response.ok ? undefined : data?.error || `Request failed with status ${response.status}`,
      status: response.status,
    };
  } catch (error) {
    console.error(`API POST error for ${url}:`, error);
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
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = response.ok ? await response.json() : null;
    
    return {
      data,
      error: response.ok ? undefined : data?.error || `Request failed with status ${response.status}`,
      status: response.status,
    };
  } catch (error) {
    console.error(`API PUT error for ${url}:`, error);
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
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    
    const data = response.ok ? await response.json() : null;
    
    return {
      data,
      error: response.ok ? undefined : data?.error || `Request failed with status ${response.status}`,
      status: response.status,
    };
  } catch (error) {
    console.error(`API DELETE error for ${url}:`, error);
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
  const headers = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
    credentials: 'include',
  });
}