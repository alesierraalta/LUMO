/**
 * 🚨 EXTREME DEBUG API ENDPOINT
 * Provides real-time access to extreme debugging dashboard data
 * Based on critical production failure analysis from 2025-06-29
 */

import { NextRequest, NextResponse } from 'next/server';
import { RealTimeDashboard } from '@/lib/monitoring/real-time-dashboard';

export async function GET(request: NextRequest) {
  try {
    console.log('🚨 [EXTREME DEBUG API] Dashboard data requested');
    
    const dashboard = RealTimeDashboard.getInstance();
    const dashboardData = dashboard.getDashboardData();
    
    // Add additional system information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };

    // Check for critical configuration issues
    const criticalIssues = [];
    
    if (!dashboardData.currentMetrics?.buildIdStatus) {
      criticalIssues.push({
        type: 'BUILD_ID_MISSING',
        message: 'BUILD_ID file not found - application may be running in development mode',
        severity: 'CRITICAL',
        recommendations: [
          'Verify build process completes successfully',
          'Check if .next/BUILD_ID file exists',
          'Ensure production build is used in deployment'
        ]
      });
    }

    if (dashboardData.currentMetrics?.configurationStatus === 'CRITICAL') {
      criticalIssues.push({
        type: 'CONFIGURATION_FAILURE',
        message: 'Critical configuration validation failures detected',
        severity: 'CRITICAL',
        recommendations: [
          'Check environment variables in Choreo console',
          'Verify Supabase configuration',
          'Review application logs for specific errors'
        ]
      });
    }

    const response = {
      status: 'success',
      timestamp: new Date().toISOString(),
      dashboard: dashboardData,
      systemInfo,
      criticalIssues,
      extremeDebugging: {
        enabled: true,
        version: '1.0.0',
        features: [
          'Real-time configuration monitoring',
          'BUILD_ID validation',
          'Predictive failure detection',
          'Automated root cause analysis',
          'Startup phase tracking'
        ]
      }
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('🚨 [EXTREME DEBUG API] Error fetching dashboard data:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: 'Failed to fetch extreme debugging data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🚨 [EXTREME DEBUG API] Manual trigger requested:', body);

    const dashboard = RealTimeDashboard.getInstance();
    
    if (body.action === 'export') {
      const exportData = dashboard.exportDashboardData();
      
      return NextResponse.json({
        status: 'success',
        timestamp: new Date().toISOString(),
        action: 'export',
        data: JSON.parse(exportData)
      });
    }

    if (body.action === 'reset') {
      // Note: In a real implementation, you might want to add reset functionality
      return NextResponse.json({
        status: 'success',
        timestamp: new Date().toISOString(),
        action: 'reset',
        message: 'Dashboard reset functionality not implemented in this version'
      });
    }

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: 'Unknown action',
        supportedActions: ['export', 'reset']
      }
    }, { status: 400 });

  } catch (error) {
    console.error('🚨 [EXTREME DEBUG API] Error processing POST request:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: 'Failed to process extreme debugging request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
} 