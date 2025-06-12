'use client';

/**
 * Centralized API client with automatic authentication
 * Fixes 401 Unauthorized errors by including Bearer tokens in all requests
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Extract authentication token from cookies
 */
const getAuthToken = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth-token') {
        return value;
      }
    }
    return null;
  } catch (error) {
    console.error('Error extracting auth token:', error);
    return null;
  }
};

/**
 * Get authentication headers with Bearer token
 */
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Authenticated fetch wrapper that automatically includes Bearer token
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const authHeaders = getAuthHeaders();
  
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
      console.error(`Authentication failed for ${url}:`, {
        status: response.status,
        hasToken: !!getAuthToken(),
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
 * Authenticated API client with typed responses
 */
export const apiClient = {
  /**
   * GET request with authentication
   */
  get: async <T = any>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await authenticatedFetch(url, {
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
   * POST request with authentication
   */
  post: async <T = any>(url: string, body?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await authenticatedFetch(url, {
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
   * PUT request with authentication
   */
  put: async <T = any>(url: string, body?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await authenticatedFetch(url, {
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
   * DELETE request with authentication
   */
  delete: async <T = any>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await authenticatedFetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: `Failed to delete: ${response.status} - ${errorText}`,
          status: response.status,
        };
      }

      // Handle empty response for DELETE requests
      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

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
 * Specific API endpoints with authentication
 */
export const locationsApi = {
  getAll: () => apiClient.get('/api/locations'),
  getById: (id: string) => apiClient.get(`/api/locations/${id}`),
  create: (data: any) => apiClient.post('/api/locations', data),
  update: (id: string, data: any) => apiClient.put(`/api/locations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/locations/${id}`),
};

export const categoriesApi = {
  getAll: () => apiClient.get('/api/categories'),
  getById: (id: string) => apiClient.get(`/api/categories/${id}`),
  create: (data: any) => apiClient.post('/api/categories', data),
  update: (id: string, data: any) => apiClient.put(`/api/categories/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/categories/${id}`),
};

/**
 * Handle authentication errors consistently
 */
export const handleAuthError = (error: string, status: number) => {
  if (status === 401) {
    console.error('Authentication required. Redirecting to login...');
    // In a real app, you might want to redirect to login page
    // window.location.href = '/login';
    return 'Authentication required. Please log in again.';
  }
  return error;
}; 