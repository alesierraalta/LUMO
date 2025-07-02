import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // CRITICAL: Bypass ALL API routes immediately
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Skip static assets
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') || 
      pathname.includes('.') || 
      pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // Allow all routes for now to fix production issue
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|public|api/).*)',
  ],
} 