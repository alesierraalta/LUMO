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

// Obtener usuario actual desde la API
export const getCurrentUser = async (): Promise<User | null> => {
  try {
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

    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include', // Incluir cookies
      headers,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
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