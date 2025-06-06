// Endpoint específico para Choreo - Ultra robusto
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const startTime = Date.now();
  try {
    // Información básica del servidor
    const serverInfo = {
      status: 'healthy',
      service: 'LUMO Inventory System',
      platform: 'Choreo',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      uptime_seconds: Math.floor(process.uptime()),
      response_time_ms: Date.now() - startTime,
      // Variables de entorno críticas (sin valores sensibles)
      env_check: {
        database_url: !!process.env.DATABASE_URL,
        : !!process.env.,
        : !!process.env.,
        node_env: process.env.NODE_ENV,
        hostname: process.env.HOSTNAME || 'choreo-container'
      },
      // Información del sistema
      system: {
        memory_usage: process.memoryUsage(),
        platform: process.platform,
        node_version: process.version
      }
    };
    return new Response(JSON.stringify(serverInfo, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Service': 'LUMO-API',
        'X-Platform': 'Choreo'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      error_type: 'server_error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Error': 'true'
      }
    });
  }
}
export async function POST() {
  return new Response(JSON.stringify({
    method: 'POST',
    status: 'working',
    message: 'POST method is functional',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}