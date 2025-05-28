import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'working',
    message: 'Simple API endpoint is functional',
    timestamp: new Date().toISOString(),
    server_info: {
      environment: process.env.NODE_ENV,
      hostname: process.env.HOSTNAME || 'unknown',
      database_url_configured: !!process.env.DATABASE_URL
    }
  });
}

export async function POST() {
  return NextResponse.json({
    method: 'POST',
    status: 'working',
    message: 'POST method works',
    timestamp: new Date().toISOString()
  });
} 