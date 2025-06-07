# Choreo Automated Debug Log System

## Overview

The **Choreo Automated Debug Log System** is a comprehensive monitoring, diagnostic, and self-healing solution designed specifically for WSO2 Choreo deployments. This system automatically detects common deployment issues, applies fixes when possible, and provides detailed logging and notification capabilities.

## ✨ Features

- **🔍 Automatic Issue Detection**: Detects Prisma P6001 errors, Clerk authentication issues, build problems, and more
- **🔧 Self-Healing Capabilities**: Automatically fixes common deployment issues without manual intervention
- **📊 Real-time Dashboard**: Visual monitoring interface accessible at `/choreo-status`
- **🚨 Smart Notifications**: Supports Slack, Teams, email, and webhook notifications
- **📝 Comprehensive Logging**: Structured logging with correlation IDs and performance metrics
- **🛡️ Authentication Bypass**: Debug access without login during troubleshooting
- **🏥 Health Monitoring**: API endpoints for external monitoring systems

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Choreo Debug System                      │
├─────────────────────────────────────────────────────────────┤
│  🔍 Issue Detection     │  🔧 Auto-Fix Modules               │
│  ├─ Prisma P6001        │  ├─ Database URL correction        │
│  ├─ Clerk SSL/CDN       │  ├─ Binary targets update          │
│  ├─ Build/Deploy        │  ├─ Environment validation         │
│  ├─ Environment         │  └─ Package.json fixes             │
│  └─ Network/Resources   │                                    │
├─────────────────────────────────────────────────────────────┤
│  📊 Dashboard           │  🚨 Notifications                  │
│  ├─ /choreo-status      │  ├─ Slack integration              │
│  ├─ Real-time updates   │  ├─ Teams/Discord                  │
│  └─ Issue management    │  ├─ Email alerts                   │
│                        │  └─ Webhook endpoints              │
├─────────────────────────────────────────────────────────────┤
│  📝 Logging             │  🏥 Health Monitoring              │
│  ├─ Structured logs     │  ├─ /api/choreo-health             │
│  ├─ Correlation IDs     │  ├─ System metrics                 │
│  ├─ Performance timers  │  └─ Status reporting               │
│  └─ Log rotation        │                                    │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Validation

Before deployment, validate your system:

```bash
npm run validate-debug-system
```

This comprehensive validation script checks:
- ✅ All core debug system components
- ✅ API endpoints functionality
- ✅ Dashboard accessibility
- ✅ Fix modules integration
- ✅ Authentication bypass setup
- ✅ Environment configuration

### 2. Access Debug Dashboard

**During Development:**
- Access: `http://localhost:3000/choreo-status`

**During Choreo Deployment Issues:**
- Access: `https://your-app.choreo.dev/choreo-status`
- Alternative: `https://your-app.choreo.dev/choreo-debug-link`

### 3. API Health Check

Monitor system health via API:
```bash
curl https://your-app.choreo.dev/api/choreo-health
```

## 📁 File Structure

```
src/lib/
├── choreo-debug-system.ts              # Main debug system class
├── choreo-notification-system.ts       # Notification and alerting
├── auth/
│   └── route-protection.ts            # Authentication bypass logic
└── choreo-fixes/
    ├── prisma-p6001-fix.ts            # Prisma P6001 error fixes
    ├── clerk-ssl-fix.ts               # Clerk authentication fixes
    └── build-deployment-detector.ts    # Build/deployment issue detection

src/app/
├── choreo-status/
│   └── page.tsx                       # Debug dashboard UI
├── choreo-debug-link/
│   └── page.tsx                       # Alternative access point
├── debug/
│   └── route.ts                       # Debug redirect route
└── api/
    └── choreo-health/
        └── route.ts                   # Health check API

scripts/
├── auto-debug-init.js                 # Startup initialization
├── validate-debug-system.js           # System validation
├── verify-choreo-deployment.js        # Deployment verification
└── fix-p6001-final.js                # Enhanced P6001 fix (modified)
```

## 🔧 Configuration

### Environment Variables

**Required:**
```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

**Optional (Notifications):**
```env
# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
SLACK_CHANNEL=#deployments

# Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourapp.com
ALERT_EMAIL_RECIPIENTS=admin@yourapp.com,dev@yourapp.com

# External Monitoring
MONITORING_WEBHOOK_URL=https://your-monitoring-system.com/webhook
MONITORING_WEBHOOK_TOKEN=your-webhook-token
```

### Package.json Scripts

The system adds these scripts to your `package.json`:

```json
{
  "scripts": {
    "start": "node scripts/auto-debug-init.js && node server.js",
    "choreo-debug": "node scripts/auto-debug-init.js",
    "validate-debug-system": "node scripts/validate-debug-system.js",
    "deploy-ready": "npm run validate-debug-system && echo 'System validated successfully!'",
    "verify-deployment": "node scripts/verify-choreo-deployment.js"
  }
}
```

## 🎯 Common Use Cases

### 1. Deployment Troubleshooting

When a Choreo deployment fails:

1. **Access the debug dashboard**: `/choreo-status`
2. **Review detected issues** in real-time
3. **Apply automatic fixes** via the dashboard
4. **Monitor progress** with live updates

### 2. Prisma P6001 Error Resolution

The system automatically detects and fixes:
- ❌ `prisma://` protocol in DATABASE_URL
- ❌ Missing binary targets for Choreo
- ❌ Incorrect Prisma client generation
- ❌ Schema configuration issues

**Automatic actions:**
1. Converts `prisma://` to `postgresql://`
2. Updates binary targets to include `debian-openssl-3.0.x`
3. Regenerates Prisma client
4. Validates database connectivity

### 3. Clerk Authentication Issues

Detects and provides guidance for:
- ❌ Missing environment variables
- ❌ Key format validation
- ❌ Environment mismatches (test vs live)
- ❌ SSL/CDN connectivity issues

### 4. Build and Deployment Problems

Automatically fixes:
- ❌ Missing build scripts in package.json
- ❌ Missing Prisma generate in build process
- ❌ Incorrect Dockerfile configuration
- ❌ Missing Node.js version specification

## 🚨 Notification System

### Slack Integration

Add to your environment:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_CHANNEL=#deployments
```

**Message format:**
```
🔥 Critical Issue Detected: Database Connection Failed
Severity: CRITICAL
Type: deployment-failure
Source: choreo-debug-system
Time: 2024-01-15 10:30:00

Description: Prisma P6001 error detected during deployment
- Issue: Invalid database URL protocol
- Auto-fix: Applied (prisma:// → postgresql://)
- Status: Resolved automatically
```

### Email Alerts

Configure SMTP settings:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@yourapp.com
SMTP_PASSWORD=your-app-password
ALERT_EMAIL_RECIPIENTS=admin@yourapp.com,dev@yourapp.com
```

### Webhook Integration

For external monitoring systems:
```env
MONITORING_WEBHOOK_URL=https://your-monitoring.com/webhook
MONITORING_WEBHOOK_TOKEN=your-secret-token
```

**Webhook payload:**
```json
{
  "event": {
    "id": "evt_123456",
    "timestamp": "2024-01-15T10:30:00Z",
    "type": "critical-issue",
    "severity": "critical",
    "title": "Database Connection Failed",
    "description": "Prisma P6001 error detected",
    "source": "choreo-debug-system",
    "deploymentId": "deploy_789",
    "metadata": {
      "autoFixed": true,
      "fixApplied": "database-url-correction"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "choreo-debug-system"
}
```

## 📊 Dashboard Features

### Real-time Status Monitor

- **🟢 Healthy**: All systems operational
- **🟡 Degraded**: Non-critical issues detected
- **🔴 Unhealthy**: Critical issues require attention

### Issue Management

- **Automatic Detection**: Issues appear in real-time
- **One-click Fixes**: Apply fixes directly from dashboard
- **Progress Tracking**: Monitor fix application progress
- **Historical View**: Review past issues and resolutions

### System Metrics

- **Response Time**: API endpoint performance
- **Memory Usage**: Application resource consumption
- **Database Status**: Connection health and query performance
- **Authentication**: Clerk service connectivity

### Debug Actions

- **🔄 Refresh Status**: Force system re-evaluation
- **🔧 Apply Fixes**: Trigger automatic fix application
- **📊 View Logs**: Access detailed system logs
- **🧪 Test Connectivity**: Validate external service connections

## 🛡️ Security Features

### Authentication Bypass

During deployment troubleshooting, the debug dashboard bypasses normal authentication requirements:

- **Debug routes**: `/choreo-status`, `/choreo-debug-link`, `/debug`
- **API endpoints**: `/api/choreo-health`
- **Security header**: `X-Choreo-Debug: Enabled`

⚠️ **Security Note**: Debug access is logged for monitoring and should be disabled in production after troubleshooting.

### Route Protection

The system includes smart route protection:
```typescript
// Public routes (no auth required)
const publicRoutes = [
  '/choreo-status',
  '/choreo-debug-link', 
  '/api/choreo-health'
];
```

## 📈 Performance Monitoring

### Performance Timers

The system tracks operation performance:
```typescript
logger.startPerformanceTimer('database-connectivity-check');
// ... perform operation
logger.endPerformanceTimer('database-connectivity-check', success, error);
```

### Metrics Collection

- **Response Times**: API endpoint latency
- **Memory Usage**: Heap and external memory consumption
- **CPU Usage**: Process CPU utilization
- **Database Performance**: Query execution times

### Health Score Calculation

The system calculates an overall health score based on:
- Issue severity and count
- System performance metrics
- External service connectivity
- Auto-fix success rate

## 🔄 Automated Fix Modules

### Prisma P6001 Fix (`prisma-p6001-fix.ts`)

**Detects:**
- Invalid DATABASE_URL protocols
- Missing binary targets
- Client generation failures

**Fixes:**
- URL protocol correction
- Binary target updates
- Client regeneration
- Connectivity validation

### Clerk SSL Fix (`clerk-ssl-fix.ts`)

**Detects:**
- Missing environment variables
- Invalid key formats
- Environment mismatches
- API connectivity issues

**Provides:**
- Configuration guidance
- Connectivity testing
- Fallback mechanisms
- Error handling

### Build/Deployment Detector (`build-deployment-detector.ts`)

**Detects:**
- Missing package.json scripts
- Dockerfile configuration issues
- Dependency problems
- Resource constraints

**Fixes:**
- Script generation
- Configuration updates
- Dependency validation
- Resource optimization

## 🧪 Testing and Validation

### Pre-deployment Validation

Run the comprehensive validation script:
```bash
npm run validate-debug-system
```

**Validation includes:**
1. ✅ Core system components
2. ✅ API endpoints functionality  
3. ✅ Dashboard accessibility
4. ✅ Notification system
5. ✅ Fix modules integration
6. ✅ Logging system
7. ✅ Authentication bypass
8. ✅ Environment configuration
9. ✅ Package.json scripts
10. ✅ TypeScript compilation

### Deployment Readiness Check

```bash
npm run deploy-ready
```

Validates the entire system and provides a deployment readiness report.

### Manual Testing

**Test notification channels:**
```bash
# Test Slack integration
curl -X POST /api/choreo-health/test-notifications

# Test webhook endpoints
curl -X POST /api/choreo-health/test-webhooks
```

**Test dashboard access:**
```bash
# During deployment
curl https://your-app.choreo.dev/choreo-status

# Check API health
curl https://your-app.choreo.dev/api/choreo-health
```

## 📝 Logging

### Log Structure

All logs include:
- **Timestamp**: ISO 8601 format
- **Category**: Component identifier
- **Level**: INFO, WARN, ERROR, FATAL
- **Message**: Human-readable description
- **Metadata**: Structured additional data
- **Correlation ID**: Request tracking
- **Performance**: Operation timing

### Log Locations

- **Application Logs**: `logs/choreo-debug/`
- **Issue Logs**: `logs/choreo-debug/issues-{deploymentId}.log`
- **Status Logs**: `logs/choreo-debug/status-{deploymentId}.log`
- **System Logs**: Console output + file system

### Log Rotation

The system automatically manages log files:
- **Retention**: 7 days for debug logs
- **Size Limit**: 10MB per log file
- **Compression**: Older logs are compressed
- **Cleanup**: Automatic removal of expired logs

## 🚀 Deployment Guide

### 1. Pre-deployment Checklist

- [ ] Run `npm run validate-debug-system`
- [ ] Verify all required environment variables
- [ ] Test notification channels (optional)
- [ ] Review and commit all changes
- [ ] Backup current configuration

### 2. Choreo Deployment

1. **Push to repository**:
   ```bash
   git add .
   git commit -m "Add Choreo Automated Debug Log System"
   git push origin main
   ```

2. **Monitor deployment**:
   - Watch Choreo build logs for issues
   - Access debug dashboard immediately if problems occur
   - Monitor notifications for alerts

3. **Post-deployment validation**:
   ```bash
   # Check system health
   curl https://your-app.choreo.dev/api/choreo-health
   
   # Access debug dashboard
   open https://your-app.choreo.dev/choreo-status
   ```

### 3. Troubleshooting Access

If normal access fails during deployment:

1. **Direct debug access**: `https://your-app.choreo.dev/choreo-debug-link`
2. **Alternative route**: `https://your-app.choreo.dev/debug`
3. **API health check**: `https://your-app.choreo.dev/api/choreo-health`

### 4. Production Considerations

- **Disable debug access** after troubleshooting is complete
- **Monitor notification channels** for ongoing alerts
- **Review logs regularly** for system health trends
- **Update fix modules** as new issues are discovered

## 🤝 Contributing

### Adding New Fix Modules

1. Create module in `src/lib/choreo-fixes/`
2. Implement issue detection and fix logic
3. Add to debug system registration
4. Update validation script
5. Document in this README

### Adding Notification Channels

1. Extend `NotificationChannel` interface
2. Implement channel-specific logic in notification system
3. Add environment variable documentation
4. Test with validation script

### Improving Dashboard

1. Add new components to `/choreo-status/page.tsx`
2. Implement real-time updates
3. Follow existing UI patterns
4. Test accessibility features

## 📞 Support

### Getting Help

1. **Debug Dashboard**: First point of investigation
2. **Validation Script**: Run `npm run validate-debug-system`
3. **Log Analysis**: Check `logs/choreo-debug/` directory
4. **API Health**: Monitor `/api/choreo-health` endpoint

### Common Issues

**Dashboard not accessible:**
- Try alternative routes: `/choreo-debug-link` or `/debug`
- Check middleware configuration
- Verify authentication bypass setup

**Notifications not working:**
- Verify environment variables
- Test channels individually
- Check webhook URLs and tokens

**Auto-fixes not applying:**
- Check file permissions
- Verify module imports
- Review error logs for details

### Reporting Issues

When reporting issues, include:
- Output from `npm run validate-debug-system`
- Contents of `deployment-validation-report.json`
- Relevant log entries from `logs/choreo-debug/`
- Dashboard screenshots (if accessible)
- Environment configuration (sanitized)

---

## 📄 License

This Choreo Automated Debug Log System is part of the LUMO Inventory Management application and follows the same licensing terms.

---

**🎉 Congratulations!** You now have a comprehensive, automated debug system that will significantly reduce deployment troubleshooting time and improve your Choreo deployment success rate. 