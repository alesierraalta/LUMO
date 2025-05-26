import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Add comprehensive debugging
console.log('[MIDDLEWARE] Middleware loading...');
console.log('[MIDDLEWARE] Next.js version:', process.env.npm_package_version || 'unknown');
console.log('[MIDDLEWARE] Node version:', process.version);
console.log('[MIDDLEWARE] Working directory:', process.cwd());

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/debug-env',
  '/admin-diagnostics',
  '/clerk-diagnostics',
  '/permission-debug',
  '/fix-admin',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  console.log('[MIDDLEWARE DEBUG]', {
    path: req.nextUrl.pathname,
    publishable_key_exists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    publishable_key_prefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10) + '...' || 'undefined',
    secret_key_exists: !!process.env.CLERK_SECRET_KEY,
    skip_auth: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH,
    node_env: process.env.NODE_ENV,
    request_headers: Object.fromEntries(req.headers.entries()),
    user_agent: req.headers.get('user-agent'),
    method: req.method,
    url: req.url,
  });

  // Add file system debugging for CSS-related files
  try {
    const fs = require('fs');
    const cssDebug = {
      static_dir_exists: fs.existsSync('.next/static'),
      css_dir_exists: fs.existsSync('.next/static/css'),
      chunks_dir_exists: fs.existsSync('.next/static/chunks'),
      server_js_exists: fs.existsSync('.next/standalone/server.js'),
    };
    
    if (req.nextUrl.pathname === '/') {
      console.log('[MIDDLEWARE CSS-DEBUG]', cssDebug);
      
      // Try to read manifest files
      try {
        if (fs.existsSync('.next/static/chunks')) {
          const chunks = fs.readdirSync('.next/static/chunks');
          console.log('[MIDDLEWARE] Chunks available:', chunks.slice(0, 5));
        }
             } catch (e) {
         console.log('[MIDDLEWARE] Error reading chunks:', (e as Error).message);
       }
     }
   } catch (e) {
     console.log('[MIDDLEWARE] Error in CSS debugging:', (e as Error).message);
  }

  // Skip authentication for public routes
  if (isPublicRoute(req)) {
    console.log('[MIDDLEWARE] Public route, skipping auth');
    return NextResponse.next();
  }

  // Skip authentication if explicitly disabled
  if (process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true') {
    console.log('[MIDDLEWARE] Auth disabled via environment variable');
    return NextResponse.next();
  }

  try {
    // Get the auth object
    const { userId, redirectToSignIn } = await auth();
    console.log('[MIDDLEWARE] Auth check result:', { userId: !!userId });

    // If user is not signed in and route is not public, redirect to sign-in
    if (!userId) {
      console.log('[MIDDLEWARE] No user ID, redirecting to sign-in');
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    console.log('[MIDDLEWARE] User authenticated, proceeding');
    return NextResponse.next();
  } catch (error) {
    console.error('[MIDDLEWARE] Error during authentication:', error);
    // In case of auth error, still allow the request to proceed
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 