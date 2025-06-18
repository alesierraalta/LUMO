import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, createServerSupabaseClient } from '@/lib/supabase-auth-server'

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
    // Get token from multiple sources (including legacy auth-token for compatibility)
    let token: string | null = null
    
    // 1. Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    // 2. Cookie (multiple formats - Supabase + legacy)
    if (!token) {
      token = request.cookies.get('supabase-auth-token')?.value ||
              request.cookies.get('sb-access-token')?.value ||
              request.cookies.get('supabase.auth.token')?.value ||
              request.cookies.get('auth-token')?.value // Legacy compatibility
    }

    if (!token) {
      console.log('❌ Middleware: No token found for', pathname)
      return redirectToLogin(request)
    }

    // For legacy auth-token, try to verify with custom JWT
    if (request.cookies.get('auth-token')?.value && !request.cookies.get('supabase-auth-token')?.value) {
      console.log('🔄 Middleware: Legacy auth-token detected, upgrading to Supabase...')
      // Allow the request to continue but log that an upgrade is needed
      // The user will be prompted to log in again with Supabase
      return redirectToLogin(request)
    }

    // Verify token with Supabase
    const supabase = await createServerSupabaseClient()
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token)
    
    if (error || !authUser) {
      console.log('❌ Middleware: Invalid token for', pathname, 'Error:', error?.message)
      return redirectToLogin(request)
    }
    
    // Get full user profile
    const user = await getServerUser()
    
    if (!user) {
      console.log('❌ Middleware: User profile not found for', pathname)
      return redirectToLogin(request)
    }

    console.log('✅ Middleware: Valid Supabase token found for', pathname, ', user ID:', user.id)

    // Add user info to headers for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email || '')
    
    // Check admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      // For admin routes, we might need additional role checking
      // For now, just allow authenticated users
      console.log('🔑 Middleware: Admin route accessed by', user.email)
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

  } catch (error) {
    console.error('❌ Middleware error:', error)
    return redirectToLogin(request)
  }
}

function redirectToLogin(request: NextRequest) {
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