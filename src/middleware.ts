import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health(.*)',
  '/api/debug-env(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // Debug logging for Choreo deployment troubleshooting
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  const skipAuth = process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH;
  
  console.log('[MIDDLEWARE DEBUG]', {
    path: req.nextUrl.pathname,
    publishable_key_exists: !!publishableKey,
    publishable_key_prefix: publishableKey ? publishableKey.substring(0, 10) + '...' : 'MISSING',
    secret_key_exists: !!secretKey,
    skip_auth: skipAuth,
    node_env: process.env.NODE_ENV
  });

  // Check if we should skip Clerk authentication (used during development)
  const skipClerkAuth = skipAuth === 'true';

  // Si estamos en modo de desarrollo sin autenticación, permitir todas las rutas
  if (skipClerkAuth) {
    console.log(`[DEV MODE] Allowing access to: ${req.nextUrl.pathname}`);
    return NextResponse.next();
  }

  // For protected routes, redirect to sign-in if not authenticated
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}; 