export async function GET() {
  try {
    // Extract public environment variables
    const publicEnvVars = {
      NODE_ENV: process.env.NODE_ENV || 'production',
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'LUMO Inventory',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || ''
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
      NODE_ENV: publicEnvVars.NODE_ENV,
      app_name: publicEnvVars.NEXT_PUBLIC_APP_NAME
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
  "NODE_ENV": "production",
  "NEXT_PUBLIC_APP_NAME": "LUMO Inventory"
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