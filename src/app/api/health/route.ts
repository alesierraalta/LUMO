import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      uptime: process.uptime(),
      responseTime: '',
      checks: {
        database: 'unknown',
        auth: 'unknown'
      }
    }

    // Database connectivity check
    try {
      await prisma.$queryRaw`SELECT 1`
      health.checks.database = 'healthy'
    } catch (error) {
      health.checks.database = 'unhealthy'
      health.status = 'degraded'
    }

    // Authentication service check (Clerk)
    try {
      const hasClerkKeys = !!(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
      health.checks.auth = hasClerkKeys ? 'configured' : 'not_configured'
    } catch (error) {
      health.checks.auth = 'error'
    }

    // Response time
    const responseTime = Date.now() - startTime
    health.responseTime = `${responseTime}ms`

    // Determine overall status
    if (health.checks.database === 'unhealthy') {
      health.status = 'unhealthy'
      return NextResponse.json(health, { status: 503 })
    }

    if (health.checks.database === 'unknown' || health.checks.auth === 'error') {
      health.status = 'degraded'
      return NextResponse.json(health, { status: 200 })
    }

    return NextResponse.json(health, { status: 200 })

  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 503 })
  }
} 