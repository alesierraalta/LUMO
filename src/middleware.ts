import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isPublicRoute } from './lib/auth/route-protection';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

// Function to verify Supabase JWT token
const verifySupabaseToken = async (token: string) => {
  try {
    // Create a temporary Supabase client with the token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify the token by getting the user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error('❌ Supabase token verification error:', error);
    return null;
  }
};

// Function to get token from request
const getTokenFromRequest = (request: NextRequest): string | null => {
  // Try Authorization header first (standard for Supabase)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie as fallback
  const cookieToken = request.cookies.get('sb-access-token')?.value || 
                     request.cookies.get('supabase-auth-token')?.value ||
                     request.cookies.get('auth-token')?.value;
  
  return cookieToken || null;
};

// This middleware runs before each request
export async function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  // Skip middleware for public static files and API routes
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
    console.log(`🔒 Middleware: No Supabase auth token found for ${url}, redirecting to login`);
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If we have a token, verify it with Supabase
  if (authToken) {
    try {
      const tokenData = await verifySupabaseToken(authToken);
      
      if (!tokenData) {
        console.log(`🔒 Middleware: Invalid Supabase token for ${url}, redirecting to login`);
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      console.log(`✅ Middleware: Valid Supabase token found for ${url}, user: ${tokenData.email}`);
      
      // Add user info to headers for downstream use
      const response = NextResponse.next();
      response.headers.set('X-User-ID', tokenData.userId);
      response.headers.set('X-User-Email', tokenData.email || '');
      
      return response;
    } catch (error) {
      console.log(`🔒 Middleware: Supabase token verification error for ${url}:`, error);
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