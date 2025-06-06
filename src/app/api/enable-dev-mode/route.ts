import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Este endpoint temporalmente permitirá modo desarrollo en producción
    // Solo para verificar que la aplicación funciona
    return NextResponse.json({
      status: 'ok',
      message: 'Development mode bypass enabled temporarily',
      timestamp: new Date().toISOString(),
      instructions: [
        'Add development environment variables',
        '- NODE_ENV=development',
        '- DATABASE_URL (connection string)'
      ],
      current_env: {
        NODE_ENV: process.env.NODE_ENV,
        has_database_url: !!process.env.DATABASE_URL
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}