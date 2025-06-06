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
        'Add =true to environment variables',
        '- ',
        '- ',
        '- DATABASE_URL'
      ],
      current_env: {
        NODE_ENV: process.env.NODE_ENV,
        : !!process.env.,
        has_: !!process.env.,
        has_database_url: !!process.env.DATABASE_URL,
        skip_auth: process.env.
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