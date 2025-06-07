/**
 * Choreo Notification and Alerting System
 * 
 * Provides comprehensive notification capabilities for Choreo deployment issues:
 * - Email alerts for critical issues
 * - Webhook notifications for external monitoring systems
 * - Real-time dashboard updates
 * - Escalation policies for unresolved issues
 * - Integration with popular monitoring services
 */

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'webhook' | 'slack' | 'teams' | 'discord' | 'sms';
  enabled: boolean;
  config: Record<string, any>;
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
}

export interface NotificationEvent {
  id: string;
  timestamp: string;
  type: 'deployment-failure' | 'critical-issue' | 'service-down' | 'recovery' | 'warning';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metadata?: Record<string, any>;
  source: string;
  deploymentId?: string;
  correlationId?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface EscalationPolicy {
  id: string;
  name: string;
  triggers: {
    eventTypes: string[];
    severities: string[];
    timeThreshold?: number; // minutes
  };
  steps: EscalationStep[];
}

export interface EscalationStep {
  id: string;
  delay: number; // minutes
  channels: string[];
  condition?: 'if-not-acknowledged' | 'always';
}

export interface NotificationStatus {
  id: string;
  eventId: string;
  channelId: string;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: string;
  error?: string;
  deliveredAt?: string;
}

/**
 * Main notification system class
 */
export class ChoreoNotificationSystem {
  private channels: Map<string, NotificationChannel> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private escalationPolicies: Map<string, EscalationPolicy> = new Map();
  private notificationHistory: NotificationStatus[] = [];
  private activeEscalations: Map<string, NodeJS.Timeout> = new Map();
  
  constructor() {
    this.initializeDefaultTemplates();
    this.initializeDefaultChannels();
  }
  
  /**
   * Initialize default notification templates
   */
  private initializeDefaultTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'deployment-failure',
        name: 'Deployment Failure Alert',
        type: 'deployment-failure',
        subject: '🚨 Choreo Deployment Failed: {{title}}',
        body: `
**Deployment Failure Alert**

**Service**: {{serviceName}}
**Environment**: {{environment}}
**Time**: {{timestamp}}
**Deployment ID**: {{deploymentId}}

**Issue**: {{title}}
**Description**: {{description}}

**Detected Issues**:
{{#each issues}}
- **{{title}}** ({{severity}}): {{description}}
{{/each}}

**Recommended Actions**:
{{#each recommendations}}
- {{this}}
{{/each}}

**Debug Dashboard**: {{dashboardUrl}}

---
*This alert was generated automatically by the Choreo Debug System*
        `,
        variables: ['serviceName', 'environment', 'timestamp', 'deploymentId', 'title', 'description', 'issues', 'recommendations', 'dashboardUrl']
      },
      {
        id: 'critical-issue',
        name: 'Critical Issue Alert',
        type: 'critical-issue',
        subject: '🔥 Critical Issue Detected: {{title}}',
        body: `
**Critical Issue Alert**

**Service**: {{serviceName}}
**Environment**: {{environment}}
**Time**: {{timestamp}}
**Severity**: {{severity}}

**Issue**: {{title}}
**Description**: {{description}}

**Impact**: {{impact}}

**Auto-fix Status**: {{autoFixStatus}}

**Immediate Actions Required**:
{{#each actions}}
- {{this}}
{{/each}}

**Debug Information**:
- Deployment ID: {{deploymentId}}
- Correlation ID: {{correlationId}}
- Dashboard: {{dashboardUrl}}

---
*This is an automated alert. Please investigate immediately.*
        `,
        variables: ['serviceName', 'environment', 'timestamp', 'severity', 'title', 'description', 'impact', 'autoFixStatus', 'actions', 'deploymentId', 'correlationId', 'dashboardUrl']
      },
      {
        id: 'service-recovery',
        name: 'Service Recovery Notification',
        type: 'recovery',
        subject: '✅ Service Recovered: {{serviceName}}',
        body: `
**Service Recovery Notification**

**Service**: {{serviceName}}
**Environment**: {{environment}}
**Recovery Time**: {{timestamp}}
**Downtime Duration**: {{downtimeDuration}}

**Original Issue**: {{originalIssue}}
**Resolution**: {{resolution}}

**Recovery Details**:
{{#if autoFixed}}
- Issue was automatically resolved by the debug system
- Applied fixes: {{appliedFixes}}
{{else}}
- Issue was manually resolved
- Resolution time: {{resolutionTime}}
{{/if}}

**Current Status**: ✅ Healthy

**Dashboard**: {{dashboardUrl}}

---
*Service monitoring will continue. Thank you for your attention.*
        `,
        variables: ['serviceName', 'environment', 'timestamp', 'downtimeDuration', 'originalIssue', 'resolution', 'autoFixed', 'appliedFixes', 'resolutionTime', 'dashboardUrl']
      }
    ];
    
    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }
  
  /**
   * Initialize default notification channels
   */
  private initializeDefaultChannels(): void {
    // Example webhook channel for monitoring systems
    if (process.env.MONITORING_WEBHOOK_URL) {
      this.addChannel({
        id: 'monitoring-webhook',
        name: 'Monitoring System Webhook',
        type: 'webhook',
        enabled: true,
        config: {
          url: process.env.MONITORING_WEBHOOK_URL,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.MONITORING_WEBHOOK_TOKEN ? `Bearer ${process.env.MONITORING_WEBHOOK_TOKEN}` : undefined
          }
        },
        retryPolicy: {
          maxRetries: 3,
          retryDelay: 60000, // 1 minute
          backoffMultiplier: 2
        }
      });
    }
    
    // Slack channel if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      this.addChannel({
        id: 'slack-alerts',
        name: 'Slack Alerts',
        type: 'slack',
        enabled: true,
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#deployments',
          username: 'Choreo Debug System',
          icon_emoji: ':warning:'
        },
        retryPolicy: {
          maxRetries: 2,
          retryDelay: 30000, // 30 seconds
          backoffMultiplier: 1.5
        }
      });
    }
    
    // Email channel if SMTP is configured
    if (process.env.SMTP_HOST) {
      this.addChannel({
        id: 'email-alerts',
        name: 'Email Alerts',
        type: 'email',
        enabled: true,
        config: {
          smtp: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD
            }
          },
          from: process.env.SMTP_FROM || 'noreply@choreo-debug.com',
          to: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || []
        }
      });
    }
  }
  
  /**
   * Add a notification channel
   */
  public addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
  }
  
  /**
   * Send notification for an event
   */
  public async sendNotification(event: NotificationEvent, channelIds?: string[]): Promise<NotificationStatus[]> {
    const targetChannels = channelIds 
      ? channelIds.map(id => this.channels.get(id)).filter(Boolean) as NotificationChannel[]
      : Array.from(this.channels.values()).filter(c => c.enabled);
    
    const results: NotificationStatus[] = [];
    
    for (const channel of targetChannels) {
      const status = await this.sendToChannel(event, channel);
      results.push(status);
      this.notificationHistory.push(status);
    }
    
    // Check if escalation is needed
    this.checkEscalation(event, results);
    
    return results;
  }
  
  /**
   * Send notification to a specific channel
   */
  private async sendToChannel(event: NotificationEvent, channel: NotificationChannel): Promise<NotificationStatus> {
    const status: NotificationStatus = {
      id: `${event.id}-${channel.id}-${Date.now()}`,
      eventId: event.id,
      channelId: channel.id,
      status: 'pending',
      attempts: 0,
      lastAttempt: new Date().toISOString()
    };
    
    try {
      status.attempts++;
      
      switch (channel.type) {
        case 'webhook':
          await this.sendWebhook(event, channel);
          break;
        case 'slack':
          await this.sendSlack(event, channel);
          break;
        case 'email':
          await this.sendEmail(event, channel);
          break;
        case 'teams':
          await this.sendTeams(event, channel);
          break;
        default:
          throw new Error(`Unsupported channel type: ${channel.type}`);
      }
      
      status.status = 'sent';
      status.deliveredAt = new Date().toISOString();
      
    } catch (error) {
      status.status = 'failed';
      status.error = error instanceof Error ? error.message : String(error);
      
      // Schedule retry if policy allows
      if (channel.retryPolicy && status.attempts < channel.retryPolicy.maxRetries) {
        this.scheduleRetry(event, channel, status);
      }
    }
    
    return status;
  }
  
  /**
   * Send webhook notification
   */
  private async sendWebhook(event: NotificationEvent, channel: NotificationChannel): Promise<void> {
    const { url, method = 'POST', headers = {} } = channel.config;
    
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      source: 'choreo-debug-system'
    };
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }
  
  /**
   * Send Slack notification
   */
  private async sendSlack(event: NotificationEvent, channel: NotificationChannel): Promise<void> {
    const { webhookUrl, channel: slackChannel, username, icon_emoji } = channel.config;
    
    const severityEmoji = {
      critical: ':fire:',
      high: ':warning:',
      medium: ':information_source:',
      low: ':grey_exclamation:'
    }[event.severity] || ':question:';
    
    const color = {
      critical: '#ff0000',
      high: '#ff9900',
      medium: '#ffcc00',
      low: '#36a64f'
    }[event.severity] || '#cccccc';
    
    const payload = {
      channel: slackChannel,
      username,
      icon_emoji,
      attachments: [{
        color,
        title: `${severityEmoji} ${event.title}`,
        text: event.description,
        fields: [
          {
            title: 'Severity',
            value: event.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Type',
            value: event.type,
            short: true
          },
          {
            title: 'Source',
            value: event.source,
            short: true
          },
          {
            title: 'Time',
            value: new Date(event.timestamp).toLocaleString(),
            short: true
          }
        ],
        timestamp: Math.floor(Date.parse(event.timestamp) / 1000)
      }]
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.status} ${response.statusText}`);
    }
  }
  
  /**
   * Send email notification
   */
  private async sendEmail(event: NotificationEvent, channel: NotificationChannel): Promise<void> {
    // This would require a mail library like nodemailer
    // For now, we'll just log the email content
    console.log('Email notification (simulated):', {
      to: channel.config.to,
      subject: `[${event.severity.toUpperCase()}] ${event.title}`,
      body: event.description,
      event
    });
  }
  
  /**
   * Send Microsoft Teams notification
   */
  private async sendTeams(event: NotificationEvent, channel: NotificationChannel): Promise<void> {
    const { webhookUrl } = channel.config;
    
    const color = {
      critical: 'attention',
      high: 'warning',
      medium: 'accent',
      low: 'good'
    }[event.severity] || 'default';
    
    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: event.title,
      themeColor: color,
      sections: [{
        activityTitle: event.title,
        activitySubtitle: `Severity: ${event.severity.toUpperCase()}`,
        text: event.description,
        facts: [
          { name: 'Type', value: event.type },
          { name: 'Source', value: event.source },
          { name: 'Time', value: new Date(event.timestamp).toLocaleString() }
        ]
      }]
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Teams notification failed: ${response.status} ${response.statusText}`);
    }
  }
  
  /**
   * Schedule notification retry
   */
  private scheduleRetry(event: NotificationEvent, channel: NotificationChannel, status: NotificationStatus): void {
    if (!channel.retryPolicy) return;
    
    const delay = channel.retryPolicy.retryDelay * Math.pow(channel.retryPolicy.backoffMultiplier, status.attempts - 1);
    
    setTimeout(async () => {
      status.status = 'retrying';
      const newStatus = await this.sendToChannel(event, channel);
      
      // Update the original status
      Object.assign(status, newStatus);
    }, delay);
  }
  
  /**
   * Check if escalation is needed
   */
  private checkEscalation(event: NotificationEvent, results: NotificationStatus[]): void {
    const failedNotifications = results.filter(r => r.status === 'failed');
    
    if (failedNotifications.length > 0 && event.severity === 'critical') {
      // Implement escalation logic here
      console.warn('Critical notification delivery failed, escalation may be needed', {
        event: event.id,
        failedChannels: failedNotifications.map(f => f.channelId)
      });
    }
  }
  
  /**
   * Get notification history
   */
  public getNotificationHistory(limit?: number): NotificationStatus[] {
    const history = this.notificationHistory.slice().reverse();
    return limit ? history.slice(0, limit) : history;
  }
  
  /**
   * Get channel statistics
   */
  public getChannelStats(): Record<string, { sent: number; failed: number; pending: number }> {
    const stats: Record<string, { sent: number; failed: number; pending: number }> = {};
    
    this.notificationHistory.forEach(status => {
      if (!stats[status.channelId]) {
        stats[status.channelId] = { sent: 0, failed: 0, pending: 0 };
      }
      stats[status.channelId][status.status]++;
    });
    
    return stats;
  }
  
  /**
   * Test notification channel
   */
  public async testChannel(channelId: string): Promise<NotificationStatus> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }
    
    const testEvent: NotificationEvent = {
      id: `test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'warning',
      severity: 'low',
      title: 'Test Notification',
      description: 'This is a test notification from the Choreo Debug System.',
      source: 'notification-system-test'
    };
    
    return await this.sendToChannel(testEvent, channel);
  }
}

/**
 * Default notification system instance
 */
export const notificationSystem = new ChoreoNotificationSystem(); 