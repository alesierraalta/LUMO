import logger from '../logger';
import { AuthLogInfo, SecurityInfo } from '../logger/types';

export class AuthLogger {
  private failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  logLogin(
    userId: string,
    success: boolean,
    provider?: string,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string,
    failureReason?: string
  ): void {
    const authInfo: AuthLogInfo = {
      event: success ? 'login' : 'failed_attempt',
      userId,
      success,
      provider,
      failureReason
    };

    logger.logAuth(authInfo, {
      correlationId,
      userId: success ? userId : undefined,
      ipAddress,
      userAgent
    });

    // Track failed attempts for security monitoring
    if (!success && ipAddress) {
      this.trackFailedAttempt(ipAddress, correlationId);
    } else if (success && ipAddress) {
      this.clearFailedAttempts(ipAddress);
    }

    // Log security event for failed login
    if (!success) {
      const securityInfo: SecurityInfo = {
        event: 'failed_login_attempt',
        severity: 'medium',
        details: {
          userId,
          provider,
          failureReason,
          ipAddress: ipAddress ? this.hashIP(ipAddress) : undefined,
          userAgent
        }
      };

      logger.logSecurity(securityInfo, { correlationId });
    }
  }

  logLogout(
    userId: string,
    sessionId?: string,
    correlationId?: string,
    forced: boolean = false
  ): void {
    const authInfo: AuthLogInfo = {
      event: 'logout',
      userId,
      sessionId,
      success: true
    };

    logger.logAuth(authInfo, {
      correlationId,
      userId,
      sessionId
    });

    if (forced) {
      const securityInfo: SecurityInfo = {
        event: 'forced_logout',
        severity: 'medium',
        details: {
          userId,
          sessionId,
          reason: 'Administrative action or security concern'
        }
      };

      logger.logSecurity(securityInfo, { correlationId, userId });
    }
  }

  logSessionRefresh(
    userId: string,
    sessionId: string,
    success: boolean,
    correlationId?: string,
    error?: string
  ): void {
    const authInfo: AuthLogInfo = {
      event: 'refresh',
      userId,
      sessionId,
      success,
      failureReason: error
    };

    logger.logAuth(authInfo, {
      correlationId,
      userId,
      sessionId
    });

    if (!success) {
      const securityInfo: SecurityInfo = {
        event: 'session_refresh_failed',
        severity: 'low',
        details: {
          userId,
          sessionId,
          error
        }
      };

      logger.logSecurity(securityInfo, { correlationId, userId });
    }
  }

  logPermissionCheck(
    userId: string,
    resource: string,
    action: string,
    granted: boolean,
    permissions?: string[],
    roles?: string[],
    correlationId?: string
  ): void {
    const authInfo: AuthLogInfo = {
      event: granted ? 'login' : 'permission_denied', // Using existing enum values
      userId,
      success: granted,
      permissions,
      roles,
      failureReason: granted ? undefined : `Access denied to ${action} on ${resource}`
    };

    logger.logAuth(authInfo, {
      correlationId,
      userId
    });

    if (!granted) {
      const securityInfo: SecurityInfo = {
        event: 'permission_denied',
        severity: 'medium',
        details: {
          userId,
          resource,
          action,
          permissions,
          roles
        }
      };

      logger.logSecurity(securityInfo, { correlationId, userId });
    }
  }

  logRoleChange(
    targetUserId: string,
    adminUserId: string,
    oldRoles: string[],
    newRoles: string[],
    correlationId?: string
  ): void {
    logger.info(`User roles changed: ${targetUserId}`, {
      correlationId,
      userId: adminUserId
    }, {
      auth: {
        event: 'role_change',
        targetUserId,
        adminUserId,
        oldRoles,
        newRoles,
        timestamp: new Date().toISOString()
      }
    });

    const securityInfo: SecurityInfo = {
      event: 'role_modification',
      severity: 'high',
      details: {
        targetUserId,
        adminUserId,
        oldRoles,
        newRoles,
        rolesAdded: newRoles.filter(role => !oldRoles.includes(role)),
        rolesRemoved: oldRoles.filter(role => !newRoles.includes(role))
      }
    };

    logger.logSecurity(securityInfo, { correlationId, userId: adminUserId });
  }

  logPasswordChange(
    userId: string,
    success: boolean,
    correlationId?: string,
    adminInitiated: boolean = false,
    adminUserId?: string
  ): void {
    logger.info(`Password change ${success ? 'successful' : 'failed'}: ${userId}`, {
      correlationId,
      userId: adminInitiated ? adminUserId : userId
    }, {
      auth: {
        event: 'password_change',
        userId,
        success,
        adminInitiated,
        adminUserId,
        timestamp: new Date().toISOString()
      }
    });

    const securityInfo: SecurityInfo = {
      event: 'password_change',
      severity: adminInitiated ? 'high' : 'medium',
      details: {
        userId,
        success,
        adminInitiated,
        adminUserId
      }
    };

    logger.logSecurity(securityInfo, { correlationId, userId: adminInitiated ? adminUserId : userId });
  }

  logSuspiciousActivity(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
    correlationId?: string,
    userId?: string
  ): void {
    const securityInfo: SecurityInfo = {
      event,
      severity,
      details,
      threatLevel: this.calculateThreatLevel(severity)
    };

    logger.logSecurity(securityInfo, { correlationId, userId });

    // If critical, also log as error
    if (severity === 'critical') {
      logger.error(`Critical security event: ${event}`, undefined, { correlationId, userId }, {
        security: securityInfo
      });
    }
  }

  private trackFailedAttempt(ipAddress: string, correlationId?: string): void {
    const hashedIP = this.hashIP(ipAddress);
    const now = Date.now();
    const attempts = this.failedAttempts.get(hashedIP) || { count: 0, lastAttempt: 0 };

    // Reset counter if lockout period has passed
    if (now - attempts.lastAttempt > this.LOCKOUT_DURATION) {
      attempts.count = 0;
    }

    attempts.count++;
    attempts.lastAttempt = now;
    this.failedAttempts.set(hashedIP, attempts);

    if (attempts.count >= this.MAX_FAILED_ATTEMPTS) {
      this.logSuspiciousActivity(
        'multiple_failed_login_attempts',
        'high',
        {
          ipAddress: hashedIP,
          attemptCount: attempts.count,
          timeWindow: this.LOCKOUT_DURATION / 1000 / 60 // in minutes
        },
        correlationId
      );
    }
  }

  private clearFailedAttempts(ipAddress: string): void {
    const hashedIP = this.hashIP(ipAddress);
    this.failedAttempts.delete(hashedIP);
  }

  private hashIP(ip: string): string {
    // Simple hash function for IP anonymization
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hashed_${Math.abs(hash).toString(16)}`;
  }

  private calculateThreatLevel(severity: string): number {
    switch (severity) {
      case 'low': return 1;
      case 'medium': return 5;
      case 'high': return 8;
      case 'critical': return 10;
      default: return 1;
    }
  }

  // Get failed attempt statistics
  getFailedAttemptStats(): { totalIPs: number; activeThreats: number } {
    const now = Date.now();
    let activeThreats = 0;

    for (const [ip, attempts] of this.failedAttempts.entries()) {
      if (now - attempts.lastAttempt <= this.LOCKOUT_DURATION && attempts.count >= this.MAX_FAILED_ATTEMPTS) {
        activeThreats++;
      }
    }

    return {
      totalIPs: this.failedAttempts.size,
      activeThreats
    };
  }

  // Clear old failed attempts (cleanup method)
  cleanupOldAttempts(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [ip, attempts] of this.failedAttempts.entries()) {
      if (now - attempts.lastAttempt > this.LOCKOUT_DURATION * 2) {
        toDelete.push(ip);
      }
    }

    toDelete.forEach(ip => this.failedAttempts.delete(ip));

    if (toDelete.length > 0) {
      logger.debug(`Cleaned up ${toDelete.length} old failed attempt records`);
    }
  }
}

// Global auth logger instance
export const authLogger = new AuthLogger();

// Cleanup interval for old failed attempts
setInterval(() => {
  authLogger.cleanupOldAttempts();
}, 60 * 60 * 1000); // Every hour 