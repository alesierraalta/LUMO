import { NextRequest, NextResponse } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/sign-in',
  '/sign-up',
  // Debug and health routes - should be accessible without auth
  '/choreo-status',
  '/choreo-debug-link',
  '/api/choreo-health',
  '/api/health',
  '/api/health-simple',
  '/api/health-advanced'
];

// Check if the URL matches any of the public routes
export function isPublicRoute(url: string): boolean {
  return PUBLIC_ROUTES.some(route => url === route || url.startsWith(`${route}/`));
}

// Main route protection middleware
export async function protectRoute(request: NextRequest) {
  const url = request.nextUrl.pathname;

  // Always allow access to API routes and public routes
  if (url.startsWith('/api/') || isPublicRoute(url)) {
    return NextResponse.next();
  }

  // Check for authentication (your existing auth logic)
  const isAuthenticated = checkAuthentication(request);
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Helper function to check authentication (implement based on your auth system)
function checkAuthentication(request: NextRequest): boolean {
  // This should be replaced with your actual authentication check
  // For example, checking for auth tokens in cookies or headers
  
  // Simple example - check for an auth token in cookies
  const authToken = request.cookies.get('auth-token')?.value;
  
  return !!authToken;
} 