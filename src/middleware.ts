import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Add Edge Runtime compatible debugging
console.log('[MIDDLEWARE] Middleware loading...');
console.log('[MIDDLEWARE] Next.js version:', process.env.npm_package_version || 'unknown');

// Check if auth should be skipped
function shouldSkipAuth() {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true') {
    return true;
  }
  
  // COMENTADO: Detección automática de claves inválidas
  // Si quieres usar Clerk real, asegúrate de tener NEXT_PUBLIC_SKIP_CLERK_AUTH=false
  // y claves reales de Clerk
  /*
  // Check if we have invalid Clerk keys (placeholder keys)
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (clerkKey && (
    clerkKey.includes('Y2xlcmsuY2hvcmVvYXBwcy5kZXYk') || // "clerk.choreoapps.dev$"
    clerkKey.includes('d2lubmluZy13YWxsYWJ5LTUuY2xlcmsuYWNjb3VudHMuZGV2JA') // placeholder
  )) {
    console.log('[MIDDLEWARE] Invalid Clerk key detected, skipping auth');
    return true;
  }
  */
  
  return false;
}

// Define base public routes
const basePublicRoutes = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/debug-env',
  '/api/env-config',
  '/admin-diagnostics',
  '/clerk-diagnostics',
  '/permission-debug',
  '/fix-admin',
];

// Add dashboard and other routes if auth is skipped
const getPublicRoutes = () => {
  const routes = [...basePublicRoutes];
  
  if (shouldSkipAuth()) {
    routes.push('/dashboard(.*)');
    routes.push('/inventory(.*)');
    routes.push('/categories(.*)');
    routes.push('/locations(.*)');
    routes.push('/users(.*)');
    routes.push('/reports(.*)');
    console.log('[MIDDLEWARE] Skip auth enabled, added protected routes to public routes');
  }
  
  return routes;
};

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const skipAuth = shouldSkipAuth();
  const isPublicRoute = createRouteMatcher(getPublicRoutes());
  
  console.log('[MIDDLEWARE DEBUG]', {
    path: req.nextUrl.pathname,
    publishable_key_exists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    publishable_key_prefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10) + '...' || 'undefined',
    secret_key_exists: !!process.env.CLERK_SECRET_KEY,
    skip_auth: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH,
    skip_auth_detected: skipAuth,
    node_env: process.env.NODE_ENV,
    method: req.method,
    is_public_route: isPublicRoute(req),
  });

  // Skip authentication for public routes
  if (isPublicRoute(req)) {
    console.log('[MIDDLEWARE] Public route, skipping auth');
    return NextResponse.next();
  }

  // Skip authentication if explicitly disabled
  if (skipAuth) {
    console.log('[MIDDLEWARE] Auth disabled via environment variable or invalid keys');
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