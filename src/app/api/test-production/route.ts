import { NextResponse } from 'next/server';
export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'LUMO API is working correctly',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing'
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