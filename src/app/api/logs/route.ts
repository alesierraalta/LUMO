import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import fs from 'fs';
import path from 'path';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || 'logs-api';
  const { userId } = await auth();
  
  if (!userId) {
    logger.warn('Unauthorized access to logs API', { correlationId });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('Logs API access', { correlationId, userId });

  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search');
  const correlationFilter = searchParams.get('correlation');

  try {
    const logs = await retrieveLogs({
      level,
      start,
      end,
      limit,
      search,
      correlationId: correlationFilter
    });

    logger.info(`Retrieved ${logs.length} log entries`, { correlationId, userId }, {
      logs: {
        count: logs.length,
        filters: {
          level,
          start,
          end,
          limit,
          search: !!search,
          correlation: !!correlationFilter
        }
      }
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      correlationId,
      total: logs.length,
      logs,
      filters: {
        level,
        start,
        end,
        limit,
        search,
        correlationId: correlationFilter
      }
    }, {
      headers: {
        'x-correlation-id': correlationId,
        'cache-control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    logger.error('Failed to retrieve logs', error as Error, { correlationId, userId });
    
    return NextResponse.json({
      error: 'Failed to retrieve logs',
      message: (error as Error).message,
      correlationId
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || 'logs-api-post';
  const { userId } = await auth();
  
  if (!userId) {
    logger.warn('Unauthorized access to logs API', { correlationId });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'flush':
        await logger.flush();
        logger.info('Manual log flush triggered', { correlationId, userId });
        return NextResponse.json({ 
          success: true, 
          message: 'Logs flushed successfully',
          correlationId 
        });

      case 'health':
        const loggerHealth = await logger.getHealth();
        return NextResponse.json({
          ...loggerHealth,
          correlationId
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          supportedActions: ['flush', 'health'],
          correlationId
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Failed to process logs API request', error as Error, { correlationId, userId });
    
    return NextResponse.json({
      error: 'Failed to process request',
      message: (error as Error).message,
      correlationId
    }, { status: 500 });
  }
}

interface LogFilters {
  level?: string | null;
  start?: string | null;
  end?: string | null;
  limit: number;
  search?: string | null;
  correlationId?: string | null;
}

async function retrieveLogs(filters: LogFilters): Promise<any[]> {
  const logFilePath = process.env.LOG_FILE_PATH || './logs/application.log';
  
  // Check if log file exists
  if (!fs.existsSync(logFilePath)) {
    return [];
  }

  try {
    const logContent = await fs.promises.readFile(logFilePath, 'utf-8');
    const lines = logContent.split('\n').filter(line => line.trim());
    
    let logs: any[] = [];
    
    // Parse log lines (assuming JSON format)
    for (const line of lines) {
      try {
        const logEntry = JSON.parse(line);
        logs.push(logEntry);
      } catch {
        // If not JSON, treat as text log
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: line,
          context: {},
          raw: true
        });
      }
    }

    // Apply filters
    logs = logs.filter(log => {
      // Level filter
      if (filters.level && log.level !== filters.level.toUpperCase()) {
        return false;
      }

      // Time range filter
      if (filters.start) {
        const startTime = new Date(filters.start);
        const logTime = new Date(log.timestamp || log['@timestamp']);
        if (logTime < startTime) return false;
      }

      if (filters.end) {
        const endTime = new Date(filters.end);
        const logTime = new Date(log.timestamp || log['@timestamp']);
        if (logTime > endTime) return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const messageMatch = log.message?.toLowerCase().includes(searchLower);
        const contextMatch = JSON.stringify(log.context || {}).toLowerCase().includes(searchLower);
        if (!messageMatch && !contextMatch) return false;
      }

      // Correlation ID filter
      if (filters.correlationId) {
        const logCorrelationId = log.context?.correlationId || log.trace?.correlation_id;
        if (logCorrelationId !== filters.correlationId) return false;
      }

      return true;
    });

    // Sort by timestamp (newest first)
    logs.sort((a, b) => {
      const timeA = new Date(a.timestamp || a['@timestamp']).getTime();
      const timeB = new Date(b.timestamp || b['@timestamp']).getTime();
      return timeB - timeA;
    });

    // Apply limit
    if (filters.limit > 0) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;

  } catch (error) {
    throw new Error(`Failed to read log file: ${(error as Error).message}`);
  }
} 