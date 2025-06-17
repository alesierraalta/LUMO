'use client';

// Cliente de autenticación para componentes del cliente
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Debug counter for API calls
let apiCallCounter = 0;

// Obtener usuario actual desde la API
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Debug: Track API calls
    apiCallCounter++;
    const callId = apiCallCounter;
    console.log(`🔍 [Auth API Call #${callId}] getCurrentUser started`);
    
    // Intentar obtener el token de las cookies primero
    let token = null;
    if (typeof document !== 'undefined') {
      // Buscar el token en las cookies
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'auth-token') {
          token = value;
          break;
        }
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Si tenemos token, añadirlo al header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const startTime = Date.now();
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include', // Incluir cookies
      headers,
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ [Auth API Call #${callId}] completed in ${duration}ms`);

    if (!response.ok) {
      console.log(`❌ [Auth API Call #${callId}] failed with status ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ [Auth API Call #${callId}] user authenticated: ${data.user?.email || 'null'}`);
    return data.user || null;
  } catch (error) {
    console.error(`❌ [Auth API Call #${apiCallCounter}] Error getting current user:`, error);
    return null;
  }
};

// Login del usuario
export const loginUser = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Error de login' };
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, error: 'Error de conexión' };
  }
};

// Logout del usuario
export const logoutUser = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  } catch (error) {
    console.error('Error logging out:', error);
    return false;
  }
};

// Verificar si el usuario es admin
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'ADMIN';
};

// Verificar si el usuario es manager o admin
export const isManager = (user: User | null): boolean => {
  return user?.role === 'MANAGER' || user?.role === 'ADMIN';
};

// Debug function to get API call statistics
export const getApiCallStats = () => {
  return {
    totalCalls: apiCallCounter,
    reset: () => { apiCallCounter = 0; }
  };
}; 