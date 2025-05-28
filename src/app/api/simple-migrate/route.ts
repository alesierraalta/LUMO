import { NextResponse } from 'next/server';

// Simple endpoint para migrar la base de datos PostgreSQL
export async function GET() {
  try {
    const { PrismaClient } = await import('../../../generated/prisma');
    const prisma = new PrismaClient();

    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Hacer un query simple para verificar que las tablas existen
    try {
      const usersCount = await prisma.user.count();
      const rolesCount = await prisma.role.count();
      
      return NextResponse.json({
        status: 'success',
        message: 'Database is ready and populated',
        data: {
          users: usersCount,
          roles: rolesCount,
          database_url: process.env.DATABASE_URL ? 'configured' : 'missing',
          timestamp: new Date().toISOString()
        }
      });
    } catch (tableError: any) {
      console.log('❌ Tables do not exist, need to create schema:', tableError.message);
      
      return NextResponse.json({
        status: 'needs_migration',
        message: 'Database connected but tables need to be created',
        error: tableError.message,
        instructions: [
          'Run: npx prisma db push',
          'Then run: npx prisma db seed'
        ],
        timestamp: new Date().toISOString()
      });
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      database_url: process.env.DATABASE_URL ? 'configured' : 'missing',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST para ejecutar migración automática
export async function POST() {
  return NextResponse.json({
    status: 'info',
    message: 'Use GET method to check database status',
    timestamp: new Date().toISOString()
  });
} 