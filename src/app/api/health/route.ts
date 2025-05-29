import { NextResponse } from 'next/server';

/**
 * Simple health check endpoint to verify application status
 * Returns basic status without complex checks that might fail during deployment
 */

export async function GET() {
  const timestamp = new Date().toISOString();
  
  return NextResponse.json({
      status: 'healthy',
    timestamp,
    service: 'lumo-inventory',
    version: '1.0.0',
    environment: typeof process !== 'undefined' ? (process.env.NODE_ENV || 'development') : 'edge'
  }, { 
      status: 200,
      headers: {
      'content-type': 'application/json',
      'cache-control': 'no-cache, no-store, must-revalidate'
      }
    });
} 