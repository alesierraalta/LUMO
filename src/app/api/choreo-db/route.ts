// Test de base de datos específico para Choreo
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  
  // Verificar variables de entorno primero
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'DATABASE_URL not configured',
      timestamp: new Date().toISOString(),
      error_type: 'configuration_error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Intentar importar y usar Prisma
    const { PrismaClient } = await import('../../../generated/prisma');
    const prisma = new PrismaClient({
      log: ['error'],
      errorFormat: 'minimal'
    });

    // Test de conexión básico
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test de query simple
    const result = await prisma.$queryRaw`SELECT 1 as test_connection`;
    
    await prisma.$disconnect();

    return new Response(JSON.stringify({
      status: 'success',
      message: 'Database connection successful',
      database: {
        url_configured: true,
        connection_test: 'passed',
        query_result: result,
        provider: 'postgresql'
      },
      response_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'X-Database': 'connected'
      }
    });

  } catch (error: any) {
    console.error('❌ Database connection failed:', error);
    
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      database: {
        url_configured: true,
        connection_test: 'failed',
        provider: 'postgresql'
      },
      response_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      instructions: [
        'Check if PostgreSQL database is accessible',
        'Verify DATABASE_URL format',
        'Run database migrations if needed'
      ]
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'X-Database': 'failed'
      }
    });
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    
    if (action === 'migrate') {
      return new Response(JSON.stringify({
        status: 'info',
        message: 'Use GET method to test database connection',
        available_actions: ['test_connection'],
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Invalid action',
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 