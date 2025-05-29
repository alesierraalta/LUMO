# LUMO Debug Logging System for Choreo Deployment

## Overview

This comprehensive debug logging system provides detailed monitoring, error tracking, and performance analysis for the LUMO Inventory Management System when deployed on Choreo. The system captures every aspect of application behavior to enable rapid debugging and issue resolution.

## 🎯 Features

### 1. Centralized Logging Infrastructure
- **Multi-level logging**: TRACE, DEBUG, INFO, WARN, ERROR, FATAL
- **Multiple transports**: Console, File, Choreo-specific output
- **Structured JSON logging** with correlation IDs
- **Automatic log rotation** and buffering
- **PII sanitization** for security compliance

### 2. Request/Response Monitoring
- **Correlation ID tracking** across all requests
- **Performance timing** for all API endpoints
- **Request/response size monitoring**
- **Header sanitization** for security
- **IP address anonymization**

### 3. Database Operation Logging
- **Query performance tracking** with slow query alerts
- **Connection pool monitoring**
- **Transaction logging**
- **Parameter sanitization** for sensitive data
- **Error correlation** with application context

### 4. Authentication Flow Tracking
- **Login/logout event logging**
- **Failed attempt monitoring** with rate limiting detection
- **Session management tracking**
- **Permission check logging**
- **Security event alerting**

### 5. Error Boundary & Exception Logging
- **Global error capture** with enhanced context
- **Client-side error reporting** via API
- **Error categorization** and severity assessment
- **Stack trace capture** with correlation
- **Automatic error recovery suggestions**

### 6. Performance Metrics Collection
- **Memory usage monitoring**
- **CPU utilization tracking**
- **Web Vitals collection**
- **Response time analysis**
- **Resource utilization alerts**

### 7. Choreo-Specific Health Monitoring
- **Service health endpoints** (`/api/health-advanced`)
- **Dependency status checking**
- **Environment validation**
- **Deployment-specific metrics**
- **Real-time system status**

## 🚀 Quick Start

### Environment Configuration

Add these variables to your `.env` file:

```bash
# Choreo Deployment
CHOREO_DEPLOYMENT=true
CHOREO_SERVICE_NAME=lumo-inventory
CHOREO_VERSION=1.0.0
CHOREO_ENVIRONMENT=production

# Logging Configuration
LOG_LEVEL=INFO
ENABLE_CONSOLE_LOGS=true
ENABLE_FILE_LOGS=true
LOG_FORMAT=json
SANITIZE_PII=true

# Performance Monitoring
SLOW_QUERY_THRESHOLD=100
ENABLE_PERFORMANCE_METRICS=true
HIGH_MEMORY_THRESHOLD=90
```

### Basic Usage

```typescript
import logger from '@/lib/logger';

// Basic logging
logger.info('Application started', { userId: 'user123' });
logger.error('Database connection failed', error, { correlationId: 'req-456' });

// Specialized logging
logger.logAPI({
  method: 'GET',
  path: '/api/products',
  statusCode: 200,
  duration: 150
});

logger.logAuth({
  event: 'login',
  userId: 'user123',
  success: true
});
```

## 📁 System Architecture

### Core Components

```
src/lib/logger/
├── index.ts           # Main logger implementation
├── types.ts           # TypeScript type definitions
├── config.ts          # Environment-based configuration
├── formatters.ts      # Log formatting and PII sanitization
└── transports.ts      # Output destinations (console, file, Choreo)

src/lib/middleware/
└── request-logger.ts  # HTTP request/response logging

src/lib/db/
├── logger.ts          # Database operation logging
└── enhanced-prisma.ts # Prisma client with logging

src/lib/auth/
└── logger.ts          # Authentication event logging

src/app/api/
├── health-advanced/   # Comprehensive health checks
├── logs/             # Log querying API
└── error-report/     # Client-side error reporting
```

### Log Entry Structure

```json
{
  "@timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "message": "User authenticated successfully",
  "service": {
    "name": "lumo-inventory",
    "version": "1.0.0",
    "environment": "production",
    "region": "us-east-1",
    "instance": "choreo-inst-001"
  },
  "context": {
    "correlationId": "1705312245123-abc123def",
    "userId": "user_123",
    "sessionId": "sess_456",
    "ipAddress": "hashed_a1b2c3d4",
    "userAgent": "Mozilla/5.0..."
  },
  "metadata": {
    "auth": {
      "event": "login",
      "provider": "clerk",
      "success": true
    }
  },
  "trace": {
    "id": "1705312245123-abc123def",
    "correlation_id": "1705312245123-abc123def"
  },
  "tags": ["authenticated", "auth"]
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Minimum log level (TRACE, DEBUG, INFO, WARN, ERROR, FATAL) |
| `ENABLE_CONSOLE_LOGS` | `true` | Enable console output |
| `ENABLE_FILE_LOGS` | `true` | Enable file logging |
| `LOG_FILE_PATH` | `./logs/application.log` | Log file location |
| `LOG_FORMAT` | `json` | Log format (json/text) |
| `SANITIZE_PII` | `true` | Enable PII sanitization |
| `CHOREO_DEPLOYMENT` | `false` | Enable Choreo-specific features |

### Log Levels

- **TRACE**: Detailed execution flow (development only)
- **DEBUG**: Debug information and diagnostics
- **INFO**: General application events
- **WARN**: Warning conditions that should be addressed
- **ERROR**: Error conditions that affect functionality
- **FATAL**: Critical errors that may cause system failure

## 📊 Monitoring & Alerts

### Health Check Endpoints

#### `/api/health-advanced`
Comprehensive system health check including:
- Logger status and configuration
- Database connectivity and performance
- Authentication system status
- Memory and CPU utilization
- Dependency verification
- Choreo-specific metrics

#### `/api/logs`
Query and retrieve application logs with filtering:
- Filter by log level, time range, correlation ID
- Search log messages and metadata
- Export logs for analysis
- Real-time log streaming

### Key Metrics Tracked

1. **Performance Metrics**
   - API response times
   - Database query performance
   - Memory usage patterns
   - CPU utilization trends

2. **Security Metrics**
   - Failed authentication attempts
   - Permission denied events
   - Suspicious activity patterns
   - Rate limiting triggers

3. **Error Metrics**
   - Error frequency by type
   - Critical error patterns
   - Recovery success rates
   - Impact assessment

## 🛠️ Development Guide

### Adding Custom Logging

```typescript
// Create a specialized logger for your module
import logger from '@/lib/logger';

export function logBusinessEvent(event: string, data: any, correlationId?: string) {
  logger.info(`Business event: ${event}`, { correlationId }, {
    business: {
      event,
      data: sanitizeBusinessData(data),
      timestamp: new Date().toISOString()
    }
  });
}
```

### Middleware Integration

```typescript
// Add logging to API routes
import { withRequestLogging } from '@/lib/middleware/request-logger';

export const GET = withRequestLogging(async (request: NextRequest) => {
  // Your API logic here
  return NextResponse.json({ success: true });
});
```

### Database Logging Integration

```typescript
// Using the enhanced Prisma client
import prisma from '@/lib/db/enhanced-prisma';

// All queries are automatically logged
const users = await prisma.user.findMany();
// Logs: Query execution time, affected rows, correlation ID
```

## 🔍 Troubleshooting

### Common Issues

#### 1. High Memory Usage
**Symptoms**: Memory utilization > 90%
**Solution**: 
- Check log buffer size configuration
- Verify log rotation settings
- Monitor for memory leaks in application code

#### 2. Slow Database Queries
**Symptoms**: Queries taking > 100ms (configurable threshold)
**Solution**:
- Review query optimization
- Check database indexes
- Monitor connection pool utilization

#### 3. Authentication Failures
**Symptoms**: Multiple failed login attempts
**Solution**:
- Check Clerk configuration
- Verify environment variables
- Review security logs for patterns

### Log Analysis

#### Finding Errors by Correlation ID
```bash
# Search logs for specific request
grep "correlation-id-123" ./logs/application.log | jq '.'
```

#### Performance Analysis
```bash
# Find slow API endpoints
grep "duration" ./logs/application.log | jq 'select(.metadata.api.duration > 1000)'
```

#### Security Monitoring
```bash
# Check for failed authentication attempts
grep "failed_attempt" ./logs/application.log | jq '.metadata.auth'
```

## 🚀 Choreo Deployment

### Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Log levels set appropriately for production
- [ ] PII sanitization enabled
- [ ] Health check endpoints responding
- [ ] Database logging configured
- [ ] Error reporting functional

### Choreo-Specific Features

1. **Structured Logging Output**: JSON formatted logs with Choreo-compatible fields
2. **Health Monitoring**: Deep health checks for all system components
3. **Performance Tracking**: Choreo-optimized performance metrics
4. **Error Correlation**: Enhanced error tracking with deployment context
5. **Security Monitoring**: Built-in security event detection and alerting

### Monitoring Dashboard

Access the comprehensive system status at:
- Health: `GET /api/health-advanced`
- Logs: `GET /api/logs?level=ERROR&limit=100`
- Metrics: Included in health check response

## 📈 Performance Impact

### Resource Usage
- **Memory**: ~5-10MB additional for logging infrastructure
- **CPU**: <1% overhead for normal logging operations
- **Disk**: Configurable log rotation (default: 5 files × 10MB)
- **Network**: Minimal impact with batched log transport

### Optimization Tips
1. Use appropriate log levels for production
2. Configure log rotation for disk space management
3. Enable PII sanitization for compliance
4. Monitor buffer sizes for high-traffic applications

## 🔐 Security Considerations

### Data Protection
- **PII Sanitization**: Automatic removal of sensitive data
- **IP Anonymization**: Hash-based IP address protection
- **Header Filtering**: Sensitive headers automatically redacted
- **Query Sanitization**: Database queries cleaned before logging

### Access Control
- Log API endpoints require authentication
- Role-based access to different log levels
- Audit trail for log access and modifications

## 📞 Support

### Getting Help
1. Check health endpoints for system status
2. Review error logs with correlation IDs
3. Monitor performance metrics for bottlenecks
4. Use structured queries for log analysis

### Best Practices
1. Always include correlation IDs in requests
2. Use appropriate log levels for different environments
3. Monitor key performance indicators regularly
4. Set up alerts for critical errors and performance issues

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Compatible with**: Next.js 15, Choreo Platform, Clerk Authentication 