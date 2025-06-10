import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isPublicRoute } from './lib/auth/route-protection';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development-only';

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
];

// Admin routes that require admin role
const adminRoutes = [
  '/admin',
  '/settings/users',
  '/api/auth/debug-permissions',
  '/api/auth/sync-user',
  '/api/auth/sync-all-users',
];

// Base64url decode function
function base64urlDecode(str: string): string {
  // Add padding if needed
  str += '='.repeat((4 - str.length % 4) % 4);
  // Replace URL-safe characters
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  // Decode base64
  return atob(str);
}

// Function to verify JWT using Web Crypto API (Edge Runtime compatible)
const verifyTokenSimple = async (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
    
    // Decode payload to check expiration
    const payload = JSON.parse(base64urlDecode(payloadEncoded));
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    // For Edge Runtime, we'll do a basic signature verification
    // Import secret as crypto key
    const secretKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Create signature data
    const data = `${headerEncoded}.${payloadEncoded}`;
    const signature = Uint8Array.from(atob(signatureEncoded.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

    // Verify signature
    const isValid = await crypto.subtle.verify(
      'HMAC',
      secretKey,
      signature,
      new TextEncoder().encode(data)
    );

    if (!isValid) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
};

// Function to get token from request
const getTokenFromRequest = (request: NextRequest): string | null => {
  // Try cookie first
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) return cookieToken;

  // Try Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

// This middleware runs before each request
export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  // Skip middleware for public static files
  if (url.includes('.') || url.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Special handling for debug pages - never redirect to login
  if (url === '/choreo-status' || url.startsWith('/choreo-status/') || url === '/auth-debug') {
    // Add special debug headers and allow access
    const response = NextResponse.next();
    response.headers.set('X-Choreo-Debug', 'Enabled');
    return response;
  }
  
  // For other public routes, allow access without redirect
  if (isPublicRoute(url)) {
    return NextResponse.next();
  }

  // Check for auth token
  const authToken = getTokenFromRequest(request);
  
  // If no auth token and not a public route, redirect to login
  if (!authToken && !url.startsWith('/login')) {
    console.log(`🔒 Middleware: No auth token found for ${url}, redirecting to login`);
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If we have a token, let's try a basic validation
  if (authToken) {
    try {
      // Basic token structure check
      const parts = authToken.split('.');
      if (parts.length !== 3) {
        console.log(`🔒 Middleware: Invalid token structure for ${url}, redirecting to login`);
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Check if token is expired (basic check without signature verification)
      const payload = JSON.parse(base64urlDecode(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.log(`🔒 Middleware: Token expired for ${url}, redirecting to login`);
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      console.log(`✅ Middleware: Valid token found for ${url}, user ID: ${payload.userId}`);
    } catch (error) {
      console.log(`🔒 Middleware: Token validation error for ${url}:`, error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/ routes with POST, PUT, DELETE methods (let these pass through for API handling)
     * 2. /_next/ (internal Next.js routes)
     * 3. /_vercel/ (Vercel system routes)
     * 4. /favicon.ico, /sitemap.xml, /robots.txt (common static files)
     */
    '/((?!_next|_vercel|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}; 