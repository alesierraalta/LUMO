import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST(request: Request) {
  try {
    // Solo permitir en producción o si se proporciona la clave especial
    const { key } = await request.json();
    
    if (process.env.NODE_ENV !== 'production' && key !== 'migrate-database-now') {
      return NextResponse.json({
        status: 'error',
        message: 'Migration only allowed in production or with special key'
      }, { status: 403 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        status: 'error',
        message: 'DATABASE_URL not configured'
      }, { status: 500 });
    }

    console.log('[API-MIGRATE] Starting database migration...');

    // Ejecutar la migración
    const output = execSync('npx prisma db push --accept-data-loss', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });

    console.log('[API-MIGRATE] Migration output:', output);

    // Intentar ejecutar el seed
    let seedOutput = 'Seed skipped';
    try {
      seedOutput = execSync('npx prisma db seed', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
    } catch (seedError: any) {
      console.log('[API-MIGRATE] Seed failed (this is OK):', seedError.message);
      seedOutput = `Seed failed: ${seedError.message}`;
    }

    return NextResponse.json({
      status: 'success',
      message: 'Database migration completed',
      timestamp: new Date().toISOString(),
      details: {
        migration_output: output,
        seed_output: seedOutput,
        database_url: process.env.DATABASE_URL?.substring(0, 30) + '...'
      }
    });

  } catch (error: any) {
    console.error('[API-MIGRATE] Migration failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Migration failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'info',
    message: 'Use POST with {"key": "migrate-database-now"} to run migration',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      has_database_url: !!process.env.DATABASE_URL
    }
  });
} 