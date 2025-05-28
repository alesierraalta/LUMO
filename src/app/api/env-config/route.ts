/**
 * Environment Configuration API Endpoint
 * 
 * Serves client-side environment variables as JavaScript
 * Fallback for when static file serving doesn't work
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get the public environment variables
    const publicEnvVars = {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      NEXT_PUBLIC_SKIP_CLERK_AUTH: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH || 'false',
      NODE_ENV: process.env.NODE_ENV || 'production'
    };
    
    // Create JavaScript content (same as the static file)
    const jsContent = `// Auto-generated client environment configuration
// This file ensures NEXT_PUBLIC environment variables are available client-side
window.__NEXT_ENV__ = ${JSON.stringify(publicEnvVars, null, 2)};

// Polyfill process.env for client-side access
if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: ${JSON.stringify(publicEnvVars, null, 2)} };
}
`;

    console.log('[ENV-CONFIG-API] Serving environment configuration:', {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publicEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 
        publicEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 15) + '...' : 'missing',
      NEXT_PUBLIC_SKIP_CLERK_AUTH: publicEnvVars.NEXT_PUBLIC_SKIP_CLERK_AUTH,
      NODE_ENV: publicEnvVars.NODE_ENV
    });

    return new Response(jsContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[ENV-CONFIG-API] Error serving environment config:', error);
    
    // Return minimal fallback configuration
    const fallbackContent = `// Fallback environment configuration
window.__NEXT_ENV__ = {
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "",
  "NEXT_PUBLIC_SKIP_CLERK_AUTH": "false", 
  "NODE_ENV": "production"
};

if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: window.__NEXT_ENV__ };
}
`;

    return new Response(fallbackContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
} 