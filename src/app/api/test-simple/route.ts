import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'success',
      message: 'LUMO Server is running correctly!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      port: process.env.PORT || 'unknown',
      version: '1.0.0'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    method: 'POST',
    status: 'working',
    message: 'POST method works',
    timestamp: new Date().toISOString()
  });
} 