import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from './lib/middleware/request-logger';

// Conditional logger import for Edge Runtime compatibility
let logger: any = {
  debug: console.log,
  info: console.log,
  warn: console.warn,
  error: console.error
};

try {
  // Only import logger if running in Node.js environment
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    logger = require('./lib/logger').default;
  }
} catch (error) {
  console.warn('Logger not available in this runtime environment');
}

// Add Edge Runtime compatible debugging
console.log('[MIDDLEWARE] Middleware loading...');
console.log('[MIDDLEWARE] Next.js version:', process.env.npm_package_version || 'unknown');

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/health-simple',
  '/api/health-advanced',
  '/api/debug-env',
  '/api/env-config',
  '/api/status',
  '/api/choreo-health',
  '/api/logs'
];

const isPublicRoute = createRouteMatcher(publicRoutes);

// Create request logger instance
const requestLogger = createRequestLogger();

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Start request logging
  const requestContext = requestLogger.logRequest(req);
  
  console.log('[MIDDLEWARE DEBUG]', {
    path: req.nextUrl.pathname,
    correlationId: requestContext.correlationId,
    publishable_key_exists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    publishable_key_prefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10) + '...' || 'undefined',
    secret_key_exists: !!process.env.CLERK_SECRET_KEY,
    node_env: process.env.NODE_ENV,
    method: req.method,
    is_public_route: isPublicRoute(req),
  });

  // Log middleware processing start
  logger.debug('Middleware processing request', {
    correlationId: requestContext.correlationId,
    userId: requestContext.userId,
    sessionId: requestContext.sessionId
  }, {
    middleware: {
      path: req.nextUrl.pathname,
      method: req.method,
      isPublicRoute: isPublicRoute(req),
      userAgent: req.headers.get('user-agent'),
      referer: req.headers.get('referer')
    }
  });

  try {
    // Skip authentication for public routes
    if (isPublicRoute(req)) {
      console.log('[MIDDLEWARE] Public route, skipping auth');
      logger.debug('Public route accessed', {
        correlationId: requestContext.correlationId
      });
      
      const response = NextResponse.next();
      // Add correlation ID to response headers
      response.headers.set('x-correlation-id', requestContext.correlationId);
      
      // Log successful response for public route
      requestLogger.logResponse(requestContext.correlationId, response, req);
      
      return response;
    }

    // Get the auth object
    const { userId, redirectToSignIn } = await auth();
    console.log('[MIDDLEWARE] Auth check result:', { userId: !!userId });

    // Update request context with user information
    if (userId) {
      requestContext.userId = userId;
    }

    // If user is not signed in and route is not public, redirect to sign-in
    if (!userId) {
      console.log('[MIDDLEWARE] No user ID, redirecting to sign-in');
      
      logger.warn('Unauthorized access attempt', {
        correlationId: requestContext.correlationId,
        ipAddress: requestContext.ipAddress
      }, {
        security: {
          event: 'unauthorized_access',
          path: req.nextUrl.pathname,
          userAgent: req.headers.get('user-agent')
        }
      });

      const redirectResponse = redirectToSignIn({ returnBackUrl: req.url });
      
      // Log the redirect response
      const mockResponse = new NextResponse(null, { status: 302 });
      requestLogger.logResponse(requestContext.correlationId, mockResponse, req);
      
      return redirectResponse;
    }

    console.log('[MIDDLEWARE] User authenticated, proceeding');
    
    // Log successful authentication
    logger.info('User authenticated successfully', {
      correlationId: requestContext.correlationId,
      userId: userId
    }, {
      auth: {
        event: 'authentication_success',
        userId: userId,
        path: req.nextUrl.pathname
      }
    });

    const response = NextResponse.next();
    
    // Add correlation ID and user context to response headers
    response.headers.set('x-correlation-id', requestContext.correlationId);
    response.headers.set('x-user-id', userId);
    
    // Log successful response
    requestLogger.logResponse(requestContext.correlationId, response, req);
    
    return response;

  } catch (error) {
    console.error('[MIDDLEWARE] Error during authentication:', error);
    
    // Log authentication error
    logger.error('Middleware authentication error', error as Error, {
      correlationId: requestContext.correlationId,
      ipAddress: requestContext.ipAddress
    }, {
      middleware: {
        path: req.nextUrl.pathname,
        method: req.method,
        error: (error as Error).message
      }
    });

    // In case of auth error, redirect to sign-in
    console.log('[MIDDLEWARE] Auth error, redirecting to sign-in');
    
    const errorResponse = NextResponse.redirect(new URL('/sign-in', req.url));
    
    // Log the error response
    const mockResponse = new NextResponse(null, { status: 500 });
    requestLogger.logResponse(requestContext.correlationId, mockResponse, req, error as Error);
    
    return errorResponse;
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