import { NextRequest, NextResponse } from "next/server";

/**
 * Health check endpoint to verify application status
 * Returns basic environment configuration status (without exposing secrets)
 */
export async function GET() {
  // Basic health check that doesn't depend on database or other services
  // This ensures the app can respond even when other services are down
  return NextResponse.json({
    status: 'healthy',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || 'unknown'
  });
} 