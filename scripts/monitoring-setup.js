#!/usr/bin/env node

/**
 * LUMO Inventory Management System - Monitoring Setup
 * Task 76: Error Tracking Configuration
 * 
 * This script configures comprehensive error tracking and monitoring
 * for production deployment on Choreo platform.
 */

const fs = require('fs');
const path = require('path');

// Configuration for monitoring and error tracking
const MONITORING_CONFIG = {
  errorTracking: {
    enabled: true,
    providers: ['internal', 'choreo'],
    retentionDays: 30,
    alertThresholds: {
      errorRate: 5, // errors per minute
      criticalErrors: 1, // critical errors per hour
      responseTime: 5000, // milliseconds
      memoryUsage: 90 // percentage
    }
  },
  performance: {
    enabled: true,
    metricsInterval: 60000, // 1 minute
    slowQueryThreshold: 1000, // milliseconds
    memoryThreshold: 85, // percentage
    cpuThreshold: 80 // percentage
  },
  health: {
    checkInterval: 30000, // 30 seconds
    endpoints: [
      '/api/health',
      '/api/health-advanced'
    ],
    dependencies: [
      'supabase',
      'database',
      'filesystem'
    ]
  },
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: 7, // days
    compression: true
  }
};

/**
 * Create monitoring configuration files
 */
function createMonitoringConfig() {
  console.log('🔧 Creating monitoring configuration...');
  
  // Create monitoring directory
  const monitoringDir = path.join(process.cwd(), 'config', 'monitoring');
  if (!fs.existsSync(monitoringDir)) {
    fs.mkdirSync(monitoringDir, { recursive: true });
  }
  
  // Write monitoring config
  fs.writeFileSync(
    path.join(monitoringDir, 'config.json'),
    JSON.stringify(MONITORING_CONFIG, null, 2)
  );
  
  console.log('✅ Monitoring configuration created');
}

/**
 * Create error tracking dashboard configuration
 */
function createErrorTrackingDashboard() {
  console.log('📊 Creating error tracking dashboard...');
  
  const dashboardConfig = {
    title: 'LUMO Error Tracking Dashboard',
    version: '1.0.0',
    widgets: [
      {
        type: 'error-rate',
        title: 'Error Rate (per minute)',
        threshold: MONITORING_CONFIG.errorTracking.alertThresholds.errorRate,
        timeWindow: '1h'
      },
      {
        type: 'critical-errors',
        title: 'Critical Errors',
        threshold: MONITORING_CONFIG.errorTracking.alertThresholds.criticalErrors,
        timeWindow: '24h'
      },
      {
        type: 'response-time',
        title: 'Average Response Time',
        threshold: MONITORING_CONFIG.errorTracking.alertThresholds.responseTime,
        timeWindow: '1h'
      },
      {
        type: 'memory-usage',
        title: 'Memory Usage',
        threshold: MONITORING_CONFIG.errorTracking.alertThresholds.memoryUsage,
        timeWindow: '5m'
      },
      {
        type: 'error-categories',
        title: 'Error Categories',
        categories: [
          'authentication',
          'database',
          'validation',
          'external-service',
          'application'
        ]
      }
    ],
    alerts: [
      {
        name: 'high-error-rate',
        condition: 'error_rate > 5',
        severity: 'warning',
        notification: ['email', 'slack']
      },
      {
        name: 'critical-error',
        condition: 'severity = critical',
        severity: 'critical',
        notification: ['email', 'slack', 'sms']
      },
      {
        name: 'slow-response',
        condition: 'response_time > 5000',
        severity: 'warning',
        notification: ['email']
      }
    ]
  };
  
  const dashboardDir = path.join(process.cwd(), 'config', 'monitoring');
  fs.writeFileSync(
    path.join(dashboardDir, 'dashboard.json'),
    JSON.stringify(dashboardConfig, null, 2)
  );
  
  console.log('✅ Error tracking dashboard configuration created');
}

/**
 * Create performance monitoring configuration
 */
function createPerformanceMonitoring() {
  console.log('⚡ Creating performance monitoring configuration...');
  
  const performanceConfig = {
    metrics: {
      api: {
        endpoints: [
          '/api/auth/*',
          '/api/inventory/*',
          '/api/categories/*',
          '/api/products/*',
          '/api/sales/*'
        ],
        thresholds: {
          responseTime: 2000,
          errorRate: 2,
          throughput: 100
        }
      },
      database: {
        connections: {
          max: 20,
          warning: 15,
          critical: 18
        },
        queries: {
          slowThreshold: 1000,
          verySlowThreshold: 5000
        }
      },
      system: {
        memory: {
          warning: 80,
          critical: 90
        },
        cpu: {
          warning: 70,
          critical: 85
        },
        disk: {
          warning: 80,
          critical: 90
        }
      }
    },
    collection: {
      interval: 60000,
      retention: '7d',
      aggregation: ['1m', '5m', '1h', '1d']
    }
  };
  
  const configDir = path.join(process.cwd(), 'config', 'monitoring');
  fs.writeFileSync(
    path.join(configDir, 'performance.json'),
    JSON.stringify(performanceConfig, null, 2)
  );
  
  console.log('✅ Performance monitoring configuration created');
}

/**
 * Create backup and recovery procedures
 */
function createBackupProcedures() {
  console.log('💾 Creating backup and recovery procedures...');
  
  const backupConfig = {
    database: {
      provider: 'supabase',
      schedule: '0 2 * * *', // Daily at 2 AM
      retention: 7,
      compression: true,
      encryption: true,
      verification: true
    },
    files: {
      directories: [
        'uploads/',
        'logs/',
        'config/'
      ],
      exclude: [
        '.next/',
        'node_modules/',
        '.git/'
      ],
      schedule: '0 3 * * 0', // Weekly on Sunday at 3 AM
      retention: 4
    },
    recovery: {
      rto: 4, // Recovery Time Objective (hours)
      rpo: 24, // Recovery Point Objective (hours)
      procedures: [
        'database-restore',
        'file-restore',
        'application-restart',
        'verification'
      ]
    }
  };
  
  const configDir = path.join(process.cwd(), 'config', 'monitoring');
  fs.writeFileSync(
    path.join(configDir, 'backup.json'),
    JSON.stringify(backupConfig, null, 2)
  );
  
  console.log('✅ Backup and recovery procedures created');
}

/**
 * Create alerting system configuration
 */
function createAlertingSystem() {
  console.log('🚨 Creating alerting system configuration...');
  
  const alertConfig = {
    channels: {
      email: {
        enabled: true,
        recipients: ['admin@lumo.com', 'devops@lumo.com'],
        templates: {
          error: 'error-alert-template',
          warning: 'warning-alert-template',
          recovery: 'recovery-alert-template'
        }
      },
      slack: {
        enabled: false,
        webhook: process.env.SLACK_WEBHOOK_URL,
        channel: '#lumo-alerts',
        mentions: ['@devops', '@oncall']
      },
      sms: {
        enabled: false,
        provider: 'twilio',
        numbers: ['+1234567890']
      }
    },
    rules: [
      {
        name: 'critical-error',
        condition: 'severity = "critical"',
        channels: ['email', 'slack', 'sms'],
        cooldown: 300, // 5 minutes
        escalation: {
          enabled: true,
          delay: 900, // 15 minutes
          channels: ['sms']
        }
      },
      {
        name: 'high-error-rate',
        condition: 'error_rate > 5 AND duration > 300',
        channels: ['email', 'slack'],
        cooldown: 600, // 10 minutes
      },
      {
        name: 'database-connection-failure',
        condition: 'database_status = "down"',
        channels: ['email', 'slack', 'sms'],
        cooldown: 60, // 1 minute
        priority: 'critical'
      },
      {
        name: 'memory-usage-high',
        condition: 'memory_usage > 90 AND duration > 600',
        channels: ['email'],
        cooldown: 1800, // 30 minutes
      }
    ],
    maintenance: {
      enabled: false,
      schedule: [],
      suppressAlerts: true
    }
  };
  
  const configDir = path.join(process.cwd(), 'config', 'monitoring');
  fs.writeFileSync(
    path.join(configDir, 'alerts.json'),
    JSON.stringify(alertConfig, null, 2)
  );
  
  console.log('✅ Alerting system configuration created');
}

/**
 * Create monitoring documentation
 */
function createMonitoringDocumentation() {
  console.log('📚 Creating monitoring documentation...');
  
  const documentation = `# LUMO Monitoring & Error Tracking

## Overview

This document describes the monitoring and error tracking setup for the LUMO Inventory Management System deployed on Choreo platform.

## Error Tracking

### Configuration
- **Provider**: Internal + Choreo native monitoring
- **Retention**: ${MONITORING_CONFIG.errorTracking.retentionDays} days
- **Alert Thresholds**:
  - Error Rate: ${MONITORING_CONFIG.errorTracking.alertThresholds.errorRate} errors/minute
  - Critical Errors: ${MONITORING_CONFIG.errorTracking.alertThresholds.criticalErrors} errors/hour
  - Response Time: ${MONITORING_CONFIG.errorTracking.alertThresholds.responseTime}ms
  - Memory Usage: ${MONITORING_CONFIG.errorTracking.alertThresholds.memoryUsage}%

### Error Categories
1. **Authentication**: Login/logout, JWT validation, permission errors
2. **Database**: Connection failures, query timeouts, constraint violations
3. **Validation**: Input validation, schema validation, business rule violations
4. **External Service**: Supabase API errors, third-party service failures
5. **Application**: Unexpected errors, runtime exceptions, resource issues

### Error Severity Levels
- **LOW**: Validation errors, expected failures
- **MEDIUM**: Recoverable errors, retry-able operations
- **HIGH**: Service degradation, authentication failures
- **CRITICAL**: System failures, data corruption, security breaches

## Performance Monitoring

### Metrics Collection
- **Interval**: ${MONITORING_CONFIG.performance.metricsInterval / 1000} seconds
- **Slow Query Threshold**: ${MONITORING_CONFIG.performance.slowQueryThreshold}ms
- **Memory Threshold**: ${MONITORING_CONFIG.performance.memoryThreshold}%
- **CPU Threshold**: ${MONITORING_CONFIG.performance.cpuThreshold}%

### Key Performance Indicators (KPIs)
1. **Response Time**: Average API response time < 2 seconds
2. **Error Rate**: Error rate < 1% per hour
3. **Throughput**: Handle 100+ requests per minute
4. **Uptime**: 99.9% availability target

## Health Monitoring

### Health Check Endpoints
- \`/api/health\`: Basic health status
- \`/api/health-advanced\`: Comprehensive system health

### Dependencies Monitored
- Supabase database connection
- File system access
- Memory and CPU usage
- Network connectivity

## Backup & Recovery

### Database Backups
- **Schedule**: Daily at 2 AM UTC
- **Retention**: 7 days
- **Provider**: Supabase automatic backups
- **Verification**: Automated backup integrity checks

### File Backups
- **Schedule**: Weekly on Sunday at 3 AM UTC
- **Directories**: uploads/, logs/, config/
- **Retention**: 4 weeks
- **Compression**: Enabled

### Recovery Procedures
1. **Database Recovery**: Use Supabase point-in-time recovery
2. **File Recovery**: Restore from weekly backups
3. **Application Recovery**: Redeploy from Git repository
4. **Verification**: Run health checks and integration tests

## Alerting

### Alert Channels
- **Email**: admin@lumo.com, devops@lumo.com
- **Slack**: #lumo-alerts (if configured)
- **SMS**: Critical alerts only (if configured)

### Alert Rules
1. **Critical Errors**: Immediate notification via all channels
2. **High Error Rate**: Email + Slack after 5 minutes
3. **Database Issues**: Immediate notification via all channels
4. **Memory Issues**: Email notification after 10 minutes

## Maintenance

### Scheduled Maintenance
- **Database**: First Sunday of each month, 2-4 AM UTC
- **Application**: As needed, with 24-hour notice
- **Monitoring**: Continuous, no downtime

### Emergency Procedures
1. **Incident Detection**: Automated alerts or manual reporting
2. **Initial Response**: Acknowledge alert within 15 minutes
3. **Investigation**: Identify root cause within 1 hour
4. **Resolution**: Implement fix within 4 hours (RTO)
5. **Post-Incident**: Document lessons learned

## Dashboard Access

### Choreo Console
- URL: https://console.choreo.dev/
- Metrics: Native Choreo monitoring dashboard
- Logs: Centralized log aggregation

### Application Logs
- Location: \`/logs/application.log\`
- Format: JSON structured logs
- Rotation: Daily, 7-day retention

## Troubleshooting

### Common Issues
1. **High Memory Usage**: Check for memory leaks, restart if necessary
2. **Slow Database Queries**: Review query performance, optimize indexes
3. **Authentication Errors**: Verify JWT configuration and Supabase connection
4. **File System Errors**: Check disk space and permissions

### Contact Information
- **Primary Contact**: DevOps Team (devops@lumo.com)
- **Secondary Contact**: Development Team (dev@lumo.com)
- **Emergency Contact**: On-call engineer (+1234567890)

## Configuration Files

- \`config/monitoring/config.json\`: Main monitoring configuration
- \`config/monitoring/dashboard.json\`: Error tracking dashboard
- \`config/monitoring/performance.json\`: Performance monitoring settings
- \`config/monitoring/backup.json\`: Backup and recovery procedures
- \`config/monitoring/alerts.json\`: Alerting system configuration

---

Last Updated: ${new Date().toISOString()}
Generated by: LUMO Monitoring Setup Script v1.0.0
`;
  
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(docsDir, 'MONITORING.md'),
    documentation
  );
  
  console.log('✅ Monitoring documentation created');
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 LUMO Monitoring Setup - Tasks 76-80');
  console.log('=====================================');
  
  try {
    // Task 76: Error tracking configuration
    createMonitoringConfig();
    createErrorTrackingDashboard();
    
    // Task 77: Performance monitoring setup
    createPerformanceMonitoring();
    
    // Task 78: Backup and recovery procedures
    createBackupProcedures();
    
    // Task 79: Alerting system configuration
    createAlertingSystem();
    
    // Task 80: Documentation and handover
    createMonitoringDocumentation();
    
    console.log('\n✅ All monitoring setup tasks completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Task 76: Error tracking configuration');
    console.log('- ✅ Task 77: Performance monitoring setup');
    console.log('- ✅ Task 78: Backup and recovery procedures');
    console.log('- ✅ Task 79: Alerting system configuration');
    console.log('- ✅ Task 80: Documentation and handover');
    
    console.log('\n📁 Files created:');
    console.log('- config/monitoring/config.json');
    console.log('- config/monitoring/dashboard.json');
    console.log('- config/monitoring/performance.json');
    console.log('- config/monitoring/backup.json');
    console.log('- config/monitoring/alerts.json');
    console.log('- docs/MONITORING.md');
    
    console.log('\n🎯 Next steps:');
    console.log('1. Review monitoring configuration files');
    console.log('2. Configure alert notification channels');
    console.log('3. Set up Choreo dashboard widgets');
    console.log('4. Test backup and recovery procedures');
    console.log('5. Deploy to production with monitoring enabled');
    
  } catch (error) {
    console.error('❌ Error during monitoring setup:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  MONITORING_CONFIG
}; 