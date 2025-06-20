import { NextResponse } from 'next/server'

export async function GET() {
  const debugInfo = {
    status: 'success',
    message: 'LUMO Choreo Debug Endpoint Working!',
    timestamp: new Date().toISOString(),
    server: {
      environment: process.env.NODE_ENV || 'unknown',
      port: process.env.PORT || 'unknown',
      hostname: process.env.HOSTNAME || 'unknown',
      workingDirectory: process.cwd()
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
      serverUrl: process.env.SUPABASE_URL ? 'configured' : 'missing',
      serverKey: process.env.SUPABASE_KEY ? 'configured' : 'missing'
    },
    jwt: {
      secret: process.env.JWT_SECRET ? 'configured' : 'missing'
    },
    deployment: {
      choreo: process.env.CHOREO_DEPLOYMENT === 'true',
      buildTimestamp: process.env.BUILD_TIMESTAMP || 'unknown'
    }
  }

  return NextResponse.json(debugInfo, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    }
  })
} 