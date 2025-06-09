import { cookies } from 'next/headers';
import { getCurrentUserFromToken } from './auth-simple';

const COOKIE_NAME = 'auth-token';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

// Get current user from server cookies
export const getCurrentUser = async (): Promise<any> => {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get(COOKIE_NAME)?.value;

    if (!authToken) {
      return null;
    }

    return await getCurrentUserFromToken(authToken);
  } catch (error) {
    console.error('Get current user from cookies error:', error);
    return null;
  }
};

// Set auth cookie
export const setAuthCookie = async (token: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION,
  });
};

// Clear auth cookie
export const clearAuthCookie = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}; 