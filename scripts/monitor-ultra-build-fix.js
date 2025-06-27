#!/usr/bin/env node

/**
 * Ultra Build Fix Monitor
 * Monitors that the ultra build fix continues working correctly in Choreo production
 */

const https = require('https');
const http = require('http');

class UltraBuildFixMonitor {
  constructor(config) {
    this.config = {
      url: config.url || 'http://localhost:3000',
      interval: config.interval || 60000, // 1 minute
      timeout: config.timeout || 10000,   // 10 seconds
      maxRetries: config.maxRetries || 3,
      ...config
    };
    
    this.running = false;
    this.stats = {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      buildFixErrors: 0,
      lastCheck: null,
      lastSuccess: null,
      lastError: null
    };
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      service: 'ultra-build-fix-monitor',
      ...data
    };
    
    const emoji = {
      INFO: '📊',
      SUCCESS: '✅',
      WARNING: '⚠️',
      ERROR: '❌',
      CRITICAL: '🚨'
    }[level] || '📝';
    
    console.log(`${emoji} [${timestamp}] ${message}`);
    
    if (data && Object.keys(data).length > 0) {
      console.log('   Data:', JSON.stringify(data, null, 2));
    }
  }

  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `${this.config.url}${endpoint}`;
      const isHttps = url.startsWith('https:');
      const client = isHttps ? https : http;
      
      const options = {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'LUMO-Ultra-Build-Fix-Monitor/1.0',
          'Accept': 'application/json'
        }
      };

      const req = client.get(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: jsonData
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.setTimeout(this.config.timeout);
    });
  }

  async checkUltraBuildFix() {
    const checks = [
      {
        name: 'Health Check',
        endpoint: '/api/health',
        validator: (response) => {
          if (response.statusCode !== 200) {
            return { success: false, error: `Health check failed with status ${response.statusCode}` };
          }
          
          // Check if response indicates build mode (which would be wrong in production)
          const dataStr = JSON.stringify(response.data).toLowerCase();
          if (dataStr.includes('build mode') || dataStr.includes('mock response')) {
            return { 
              success: false, 
              error: 'Ultra build fix incorrectly active in production - build mode detected',
              critical: true
            };
          }
          
          return { success: true };
        }
      },
      {
        name: 'Categories API',
        endpoint: '/api/categories',
        validator: (response) => {
          // This endpoint should work in production, fail in build mode
          if (response.statusCode === 200) {
            const dataStr = JSON.stringify(response.data).toLowerCase();
            if (dataStr.includes('build mode') || dataStr.includes('mock response')) {
              return { 
                success: false, 
                error: 'Categories API returning build mode response in production',
                critical: true
              };
            }
            return { success: true };
          } else if (response.statusCode === 401) {
            // Unauthorized is expected without auth token
            return { success: true, note: 'Unauthorized as expected (no auth token)' };
          } else {
            return { success: false, error: `Unexpected status code: ${response.statusCode}` };
          }
        }
      },
      {
        name: 'Supabase Error Detection',
        endpoint: '/api/debug-supabase',
        validator: (response) => {
          const dataStr = JSON.stringify(response.data).toLowerCase();
          
          // Look for the specific error that ultra build fix prevents
          if (dataStr.includes('missing supabase configuration')) {
            return { 
              success: false, 
              error: 'CRITICAL: Missing Supabase configuration error detected - ultra build fix failed',
              critical: true
            };
          }
          
          if (dataStr.includes('failed to collect page data')) {
            return { 
              success: false, 
              error: 'CRITICAL: Page data collection failed - build-time error in production',
              critical: true
            };
          }
          
          return { success: true };
        }
      }
    ];

    const results = [];
    let criticalIssues = 0;
    
    for (const check of checks) {
      try {
        this.log('INFO', `Running check: ${check.name}`, { endpoint: check.endpoint });
        
        const response = await this.makeRequest(check.endpoint);
        const validation = check.validator(response);
        
        results.push({
          name: check.name,
          endpoint: check.endpoint,
          statusCode: response.statusCode,
          success: validation.success,
          error: validation.error,
          note: validation.note,
          critical: validation.critical
        });
        
        if (validation.critical) {
          criticalIssues++;
          this.stats.buildFixErrors++;
          this.log('CRITICAL', `${check.name} failed with critical issue`, {
            endpoint: check.endpoint,
            error: validation.error
          });
        } else if (!validation.success) {
          this.log('WARNING', `${check.name} failed`, {
            endpoint: check.endpoint,
            error: validation.error
          });
        } else {
          this.log('SUCCESS', `${check.name} passed`, {
            endpoint: check.endpoint,
            note: validation.note
          });
        }
        
      } catch (error) {
        results.push({
          name: check.name,
          endpoint: check.endpoint,
          success: false,
          error: error.message,
          networkError: true
        });
        
        this.log('ERROR', `${check.name} network error`, {
          endpoint: check.endpoint,
          error: error.message
        });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      success: criticalIssues === 0,
      criticalIssues,
      totalChecks: results.length,
      passedChecks: results.filter(r => r.success).length,
      results
    };
  }

  async runSingleCheck() {
    this.stats.totalChecks++;
    this.stats.lastCheck = new Date().toISOString();
    
    try {
      const result = await this.checkUltraBuildFix();
      
      if (result.success) {
        this.stats.successfulChecks++;
        this.stats.lastSuccess = result.timestamp;
        
        this.log('SUCCESS', 'Ultra build fix verification completed successfully', {
          passedChecks: result.passedChecks,
          totalChecks: result.totalChecks
        });
      } else {
        this.stats.failedChecks++;
        this.stats.lastError = result.timestamp;
        
        this.log('ERROR', 'Ultra build fix verification failed', {
          criticalIssues: result.criticalIssues,
          passedChecks: result.passedChecks,
          totalChecks: result.totalChecks
        });
        
        if (result.criticalIssues > 0) {
          this.log('CRITICAL', 'CRITICAL ISSUES DETECTED - Ultra build fix may have failed in production!');
          
          // Log specific critical issues
          result.results.filter(r => r.critical).forEach(issue => {
            this.log('CRITICAL', `Critical Issue: ${issue.name}`, {
              endpoint: issue.endpoint,
              error: issue.error
            });
          });
        }
      }
      
      return result;
      
    } catch (error) {
      this.stats.failedChecks++;
      this.stats.lastError = new Date().toISOString();
      
      this.log('ERROR', 'Ultra build fix monitoring error', {
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  start() {
    if (this.running) {
      this.log('WARNING', 'Monitor already running');
      return;
    }

    this.running = true;
    this.log('INFO', 'Starting Ultra Build Fix Monitor', {
      url: this.config.url,
      interval: `${this.config.interval}ms`,
      timeout: `${this.config.timeout}ms`
    });

    // Run initial check
    this.runSingleCheck().catch(error => {
      this.log('ERROR', 'Initial check failed', { error: error.message });
    });

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.runSingleCheck().catch(error => {
        this.log('ERROR', 'Periodic check failed', { error: error.message });
      });
    }, this.config.interval);

    // Log stats periodically
    this.statsIntervalId = setInterval(() => {
      this.logStats();
    }, 300000); // Every 5 minutes
  }

  stop() {
    if (!this.running) {
      this.log('WARNING', 'Monitor not running');
      return;
    }

    this.running = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    if (this.statsIntervalId) {
      clearInterval(this.statsIntervalId);
    }

    this.log('INFO', 'Ultra Build Fix Monitor stopped');
    this.logStats();
  }

  logStats() {
    const successRate = this.stats.totalChecks > 0 
      ? ((this.stats.successfulChecks / this.stats.totalChecks) * 100).toFixed(2)
      : 0;

    this.log('INFO', 'Ultra Build Fix Monitor Statistics', {
      totalChecks: this.stats.totalChecks,
      successfulChecks: this.stats.successfulChecks,
      failedChecks: this.stats.failedChecks,
      buildFixErrors: this.stats.buildFixErrors,
      successRate: `${successRate}%`,
      lastCheck: this.stats.lastCheck,
      lastSuccess: this.stats.lastSuccess,
      lastError: this.stats.lastError
    });
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const url = args[0] || process.env.MONITOR_URL || 'http://localhost:3000';
  const interval = parseInt(args[1]) || 60000; // 1 minute default
  
  console.log('🔧 Ultra Build Fix Monitor Starting...');
  console.log(`📍 Target URL: ${url}`);
  console.log(`⏱️ Check Interval: ${interval}ms`);
  
  const monitor = new UltraBuildFixMonitor({
    url,
    interval,
    timeout: 10000,
    maxRetries: 3
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Ultra Build Fix Monitor...');
    monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Terminating Ultra Build Fix Monitor...');
    monitor.stop();
    process.exit(0);
  });

  monitor.start();
  
  // Keep the process alive
  setInterval(() => {
    // Heartbeat
  }, 1000);
}

module.exports = UltraBuildFixMonitor; 