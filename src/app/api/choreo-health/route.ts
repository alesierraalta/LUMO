import { NextRequest, NextResponse } from 'next/server';
import { choreoDebugSystem } from '@/lib/choreo-debug-system';

// Force Node.js runtime for filesystem access
export const runtime = 'nodejs';

/**
 * GET /api/choreo-health
 * 
 * Provides comprehensive health information and issue detection for Choreo deployments
 * This endpoint integrates with the Automated Debug Log System to detect and diagnose 
 * common deployment issues
 */
export async function GET(request: NextRequest) {
  try {
    // Run issue detection
    const issues = await choreoDebugSystem.detectIssues();
    
    // Get current deployment status
    const status = await choreoDebugSystem.getStatus();
    
    // Prepare response
    const response = {
      status: status.status,
      timestamp: new Date().toISOString(),
      deploymentId: status.id,
      environment: status.environment,
      version: status.version,
      issueCount: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      highIssues: issues.filter(i => i.severity === 'high').length,
      metrics: status.metrics,
      issues: issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        category: issue.category,
        autoFixAvailable: issue.autoFixAvailable,
        autoFixApplied: issue.autoFixApplied,
        autoFixResult: issue.autoFixResult,
        possibleFixes: issue.possibleFixes
      })),
      recommendations: issues.length > 0 
        ? 'Issues detected - check details and apply suggested fixes'
        : 'No issues detected - deployment is healthy'
    };
    
    // Return appropriate status code based on issues
    const statusCode = status.status === 'healthy' ? 200 
                     : status.status === 'degraded' ? 206 
                     : 503;
    
    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Choreo-Health': status.status
      }
    });
  } catch (error) {
    console.error('Error in choreo-health endpoint:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendations: 'Check server logs for more details'
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}

/**
 * POST /api/choreo-health
 * 
 * Allows triggering self-healing actions for detected issues
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // For now, just re-run detection to apply auto-fixes
    const issues = await choreoDebugSystem.detectIssues();
    
    // Get updated status
    const status = await choreoDebugSystem.getStatus();
    
    // Prepare response
    const response = {
      status: status.status,
      timestamp: new Date().toISOString(),
      message: 'Self-healing process triggered',
      fixedIssues: issues.filter(i => i.autoFixApplied && i.autoFixResult === 'success').length,
      failedFixes: issues.filter(i => i.autoFixApplied && i.autoFixResult === 'failed').length,
      remainingIssues: issues.filter(i => !i.autoFixApplied || i.autoFixResult !== 'success').length
    };
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error in choreo-health POST endpoint:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}