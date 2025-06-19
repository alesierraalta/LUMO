'use client';

import { getSupabaseClient } from '@/lib/supabase-singleton';

/**
 * Supabase-compatible API client with automatic authentication
 * Uses Supabase access tokens for authentication
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Get Supabase authentication headers
 */
const getSupabaseAuthHeaders = async (): Promise<HeadersInit> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  try {
    const supabase = getSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!error && session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.warn('Failed to get Supabase session:', error);
  }

  return headers;
};

/**
 * Authenticated fetch wrapper using Supabase tokens
 */
export const supabaseFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const authHeaders = await getSupabaseAuthHeaders();
  
  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Log authentication errors for debugging
    if (response.status === 401) {
      console.error(`Supabase authentication failed for ${url}:`, {
        status: response.status,
        headers: config.headers,
      });
    }
    
    return response;
  } catch (error) {
    console.error(`Network error for ${url}:`, error);
    throw error;
  }
};

/**
 * Supabase-authenticated API client with typed responses
 */
export const supabaseApiClient = {
  /**
   * GET request with Supabase authentication
   */
  get: async <T = any>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await supabaseFetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: `Failed to fetch: ${response.status} - ${errorText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  },

  /**
   * POST request with Supabase authentication
   */
  post: async <T = any>(url: string, body?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await supabaseFetch(url, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: `Failed to create: ${response.status} - ${errorText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  },

  /**
   * PUT request with Supabase authentication
   */
  put: async <T = any>(url: string, body?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await supabaseFetch(url, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: `Failed to update: ${response.status} - ${errorText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  },

  /**
   * PATCH request with Supabase authentication
   */
  patch: async <T = any>(url: string, body?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await supabaseFetch(url, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: `Failed to update: ${response.status} - ${errorText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  },

  /**
   * DELETE request with Supabase authentication
   */
  delete: async <T = any>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await supabaseFetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: `Failed to delete: ${response.status} - ${errorText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  },
};

/**
 * Handle authentication errors consistently
 */
export const handleSupabaseAuthError = (error: string, status: number) => {
  if (status === 401) {
    console.error('Supabase authentication error:', error);
    // Could redirect to login or show auth error message
  }
}; 