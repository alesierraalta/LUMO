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
        'Add NEXT_PUBLIC_SKIP_CLERK_AUTH=true to environment variables',
        'Or configure proper Clerk keys:',
        '- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        '- CLERK_SECRET_KEY',
        '- DATABASE_URL'
      ],
      current_env: {
        NODE_ENV: process.env.NODE_ENV,
        has_clerk_public: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        has_clerk_secret: !!process.env.CLERK_SECRET_KEY,
        has_database_url: !!process.env.DATABASE_URL,
        skip_auth: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH
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