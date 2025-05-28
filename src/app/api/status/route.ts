import { NextResponse } from 'next/server';

// Endpoint de status que siempre responde, sin importar el estado de la base de datos
export async function GET() {
  const status = {
    app: 'LUMO Inventory System',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    version: '1.0.0',
    server: {
      ready: true,
      uptime: process.uptime(),
    },
    database: {
      url_configured: !!process.env.DATABASE_URL,
      connection_test: 'not_tested' as string,
      error: undefined as string | undefined
    },
    endpoints: {
      health: '/api/health',
      simple_migrate: '/api/simple-migrate',
      test_production: '/api/test-production'
    }
  };

  // Test básico de conexión a base de datos (sin bloquear)
  try {
    const { connectSafely, disconnectSafely } = await import('../../../lib/prisma');
    const prisma = await connectSafely();
    
    // Test rápido sin queries complicadas
    await prisma.$queryRaw`SELECT 1 as test`;
    status.database.connection_test = 'success';
    
    await disconnectSafely();
  } catch (error: any) {
    status.database.connection_test = 'failed';
    status.database.error = error.message;
  }

  return NextResponse.json(status);
}

export async function POST() {
  return NextResponse.json({
    message: 'Use GET method for status check',
    timestamp: new Date().toISOString()
  });
} 