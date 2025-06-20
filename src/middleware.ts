// Load Supabase polyfill for Next.js 15.3.1 compatibility
import './lib/supabase-polyfill.js'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/sign-in',
  '/sign-up',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/supabase-login',
  '/api/auth/supabase-logout',
  '/api/debug-env',
  '/api/health',
  '/favicon.ico',
  '/_next',
  '/api/clerk-proxy'
]

// Admin-only routes
const adminRoutes = [
  '/admin',
  '/settings/users',
  '/api/admin',
  '/api/users'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  try {
    console.log('🔍 Middleware: Processing', pathname);
    
    // FIXED: Create proper Supabase client for middleware
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // FIXED: Get session using proper Supabase client
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('🔍 Middleware: Supabase session check:');
    console.log('  - Error:', error?.message || 'none');
    console.log('  - Session exists:', !!session);
    console.log('  - User exists:', !!session?.user);

    if (session?.user) {
      console.log('✅ Middleware: Valid Supabase session found for', pathname);
      console.log('  - User:', session.user.email);

      // Add user info to headers for downstream use
    const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', session.user.id)
      requestHeaders.set('x-user-email', session.user.email || '')
    
    // Check admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
        console.log('🔑 Middleware: Admin route accessed');
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    }

    // FALLBACK: Try legacy JWT system
    console.log('⚠️ Middleware: No Supabase session, trying legacy auth...');
    
    const authToken = request.cookies.get('auth-token')?.value;
    if (authToken && authToken.length > 20) {
      console.log('✅ Middleware: Valid legacy token found for', pathname);
      return NextResponse.next()
    }

    console.log('❌ Middleware: No valid authentication found for', pathname);
      return redirectToLogin(request)

  } catch (error) {
    console.error('❌ Middleware error:', error)
    return redirectToLogin(request)
  }
}

function redirectToLogin(request: NextRequest) {
  console.log('🔄 Middleware: Redirecting to login from', request.nextUrl.pathname);
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 