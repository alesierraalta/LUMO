import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level') || 'all';
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';
  const correlationId = searchParams.get('correlationId') || '';
  
  // This is a simplified logs endpoint - in a real implementation,
  // you would store logs in a database or log aggregation service
  const mockLogs = [
    {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Debug logs endpoint accessed',
      correlationId: `debug-${Date.now()}`,
      metadata: {
        endpoint: '/api/debug/logs',
        filters: { level, limit, search, correlationId }
      }
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'WARN',
      message: 'SSL certificate issue detected',
      correlationId: 'ssl-fix-001',
      metadata: {
        ssl: {
          issue: 'cert validation',
          solution: 'redirect to CDN'
        }
      }
    },
    {
      timestamp: new Date(Date.now() - 120000).toISOString(),
      level: 'INFO',
      message: 'Database connection established',
      correlationId: 'db-001',
      metadata: {
        database: {
          latency: 45,
          status: 'connected'
        }
      }
    },
    {
      timestamp: new Date(Date.now() - 180000).toISOString(),
      level: 'ERROR',
      message: 'Clerk authentication failed',
      correlationId: 'auth-001',
      metadata: {
        auth: {
          reason: 'SSL certificate error',
          fixed: true
        }
      }
    }
  ];

  // Filter logs based on parameters
  let filteredLogs = mockLogs;

  if (level !== 'all') {
    filteredLogs = filteredLogs.filter(log => 
      log.level.toLowerCase() === level.toLowerCase()
    );
  }

  if (search) {
    filteredLogs = filteredLogs.filter(log => 
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.correlationId.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (correlationId) {
    filteredLogs = filteredLogs.filter(log => 
      log.correlationId.includes(correlationId)
    );
  }

  // Limit results
  filteredLogs = filteredLogs.slice(0, limit);

  const response = {
    timestamp: new Date().toISOString(),
    filters: { level, limit, search, correlationId },
    totalFound: filteredLogs.length,
    logs: filteredLogs,
    instructions: {
      levelOptions: ['all', 'trace', 'debug', 'info', 'warn', 'error', 'fatal'],
      examples: [
        '/api/debug/logs?level=error',
        '/api/debug/logs?search=ssl',
        '/api/debug/logs?correlationId=debug-',
        '/api/debug/logs?limit=10&level=warn'
      ]
    }
  };

  return NextResponse.json(response, {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
      'x-log-count': filteredLogs.length.toString()
    }
  });
} 