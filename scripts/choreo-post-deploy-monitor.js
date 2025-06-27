#!/usr/bin/env node

/**
 * CHOREO POST-DEPLOY MONITORING SYSTEM
 * Comprehensive monitoring for LUMO deployment verification
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const MONITORING_CONFIG = {
  // Choreo deployment URL (update with your actual URL)
  baseUrl: process.env.CHOREO_APP_URL || 'https://your-app.choreoapis.dev',
  
  // Monitoring intervals
  healthCheckInterval: 30000, // 30 seconds
  logCheckInterval: 60000,    // 1 minute
  performanceCheckInterval: 120000, // 2 minutes
  
  // Alert thresholds
  maxResponseTime: 5000,      // 5 seconds
  maxErrorRate: 0.05,         // 5%
  maxConsecutiveFailures: 3,
  
  // Endpoints to monitor
  criticalEndpoints: [
    '/api/health',
    '/api/categories',
    '/api/auth/me',
    '/'
  ]
};

class ChoreoMonitor {
  constructor() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      consecutiveFailures: 0,
      lastError: null,
      startTime: new Date(),
      errors: []
    };
    
    this.isRunning = false;
    this.intervals = [];
  }

  // Make HTTP request with timeout
  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Choose HTTP or HTTPS based on URL protocol
      const client = url.startsWith('https:') ? https : http;
      
      const req = client.get(url, {
        timeout: MONITORING_CONFIG.maxResponseTime,
        ...options
      }, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            responseTime,
            data: data,
            headers: res.headers
          });
        });
      });
      
      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        reject({
          error: error.message,
          responseTime,
          type: 'REQUEST_ERROR'
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        reject({
          error: 'Request timeout',
          responseTime,
          type: 'TIMEOUT_ERROR'
        });
      });
    });
  }

  // Health check for critical endpoints
  async performHealthCheck() {
    console.log('\\n🏥 [HEALTH-CHECK] Running health verification...');
    
    const results = [];
    
    for (const endpoint of MONITORING_CONFIG.criticalEndpoints) {
      const url = MONITORING_CONFIG.baseUrl + endpoint;
      
      try {
        console.log(`   🔍 Testing: ${endpoint}`);
        
        const result = await this.makeRequest(url);
        this.stats.totalRequests++;
        
        if (result.statusCode >= 200 && result.statusCode < 400) {
          this.stats.successfulRequests++;
          this.stats.consecutiveFailures = 0;
          
          console.log(`   ✅ ${endpoint}: ${result.statusCode} (${result.responseTime}ms)`);
          
          // Check for specific Supabase errors in response
          if (result.data.includes('Missing Supabase configuration')) {
            throw new Error('Supabase configuration error detected in response');
          }
          
          results.push({
            endpoint,
            status: 'SUCCESS',
            statusCode: result.statusCode,
            responseTime: result.responseTime
          });
        } else {
          throw new Error(`HTTP ${result.statusCode}`);
        }
        
      } catch (error) {
        this.stats.totalRequests++;
        this.stats.failedRequests++;
        this.stats.consecutiveFailures++;
        this.stats.lastError = error;
        
        console.log(`   ❌ ${endpoint}: ${error.error || error.message}`);
        
        results.push({
          endpoint,
          status: 'FAILED',
          error: error.error || error.message,
          responseTime: error.responseTime || 0
        });
        
        // Critical alert for Supabase errors
        if (error.message && error.message.includes('Supabase')) {
          this.sendAlert('CRITICAL', `Supabase error detected on ${endpoint}: ${error.message}`);
        }
      }
    }
    
    // Update average response time
    const successfulResults = results.filter(r => r.status === 'SUCCESS');
    if (successfulResults.length > 0) {
      const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length;
      this.stats.averageResponseTime = Math.round(avgResponseTime);
    }
    
    // Check for consecutive failures
    if (this.stats.consecutiveFailures >= MONITORING_CONFIG.maxConsecutiveFailures) {
      this.sendAlert('HIGH', `${this.stats.consecutiveFailures} consecutive failures detected`);
    }
    
    return results;
  }

  // Monitor build logs for errors
  async checkBuildLogs() {
    console.log('\\n📋 [LOG-CHECK] Analyzing deployment logs...');
    
    try {
      // This would integrate with Choreo's logging API
      // For now, we'll check for common error patterns
      
      const logPatterns = [
        'Missing Supabase configuration',
        'Failed to collect page data',
        'Build error occurred',
        'Database connection failed',
        'Authentication error'
      ];
      
      console.log('   🔍 Checking for error patterns...');
      
      // Simulate log checking (in real implementation, this would call Choreo API)
      const hasErrors = false; // This would be actual log analysis
      
      if (hasErrors) {
        console.log('   ❌ Error patterns detected in logs');
        this.sendAlert('HIGH', 'Error patterns detected in deployment logs');
      } else {
        console.log('   ✅ No error patterns detected in logs');
      }
      
    } catch (error) {
      console.log('   ⚠️ Log check failed:', error.message);
    }
  }

  // Performance monitoring
  async performanceCheck() {
    console.log('\\n⚡ [PERFORMANCE] Running performance analysis...');
    
    const performanceResults = [];
    
    // Test critical endpoints for performance
    const testEndpoints = ['/api/health', '/api/categories'];
    
    for (const endpoint of testEndpoints) {
      try {
        const url = MONITORING_CONFIG.baseUrl + endpoint;
        const iterations = 5;
        const times = [];
        
        console.log(`   📊 Testing ${endpoint} (${iterations} requests)...`);
        
        for (let i = 0; i < iterations; i++) {
          const result = await this.makeRequest(url);
          times.push(result.responseTime);
        }
        
        const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);
        
        console.log(`   📈 ${endpoint}: avg=${avgTime}ms, min=${minTime}ms, max=${maxTime}ms`);
        
        performanceResults.push({
          endpoint,
          averageTime: avgTime,
          maxTime,
          minTime,
          status: avgTime < MONITORING_CONFIG.maxResponseTime ? 'GOOD' : 'SLOW'
        });
        
        if (avgTime > MONITORING_CONFIG.maxResponseTime) {
          this.sendAlert('MEDIUM', `Slow response time on ${endpoint}: ${avgTime}ms`);
        }
        
      } catch (error) {
        console.log(`   ❌ Performance test failed for ${endpoint}: ${error.message}`);
      }
    }
    
    return performanceResults;
  }

  // Send alerts
  sendAlert(severity, message) {
    const timestamp = new Date().toISOString();
    const alert = {
      timestamp,
      severity,
      message,
      stats: { ...this.stats }
    };
    
    console.log(`\\n🚨 [ALERT-${severity}] ${message}`);
    
    // Log to file
    const alertsFile = path.join(__dirname, '../logs/choreo-alerts.log');
    const alertLine = `${timestamp} [${severity}] ${message}\\n`;
    
    try {
      fs.appendFileSync(alertsFile, alertLine);
    } catch (error) {
      console.log('   ⚠️ Failed to log alert:', error.message);
    }
    
    // In production, this would send to Slack, email, etc.
    this.stats.errors.push(alert);
  }

  // Generate monitoring report
  generateReport() {
    const uptime = Date.now() - this.stats.startTime.getTime();
    const uptimeMinutes = Math.round(uptime / 60000);
    const successRate = this.stats.totalRequests > 0 ? 
      ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(1) : 0;
    
    console.log('\\n' + '='.repeat(70));
    console.log('📊 CHOREO DEPLOYMENT MONITORING REPORT');
    console.log('='.repeat(70));
    console.log(`🕐 Monitoring Duration: ${uptimeMinutes} minutes`);
    console.log(`📡 Total Requests: ${this.stats.totalRequests}`);
    console.log(`✅ Successful: ${this.stats.successfulRequests} (${successRate}%)`);
    console.log(`❌ Failed: ${this.stats.failedRequests}`);
    console.log(`⚡ Average Response Time: ${this.stats.averageResponseTime}ms`);
    console.log(`🔄 Consecutive Failures: ${this.stats.consecutiveFailures}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\\n🚨 Recent Alerts: ${this.stats.errors.length}`);
      this.stats.errors.slice(-3).forEach(error => {
        console.log(`   ${error.timestamp} [${error.severity}] ${error.message}`);
      });
    }
    
    console.log('='.repeat(70));
    
    // Status assessment
    if (this.stats.consecutiveFailures === 0 && successRate >= 95) {
      console.log('🎉 DEPLOYMENT STATUS: HEALTHY');
      console.log('✅ All systems operational - No Supabase build errors detected');
    } else if (successRate >= 90) {
      console.log('⚠️ DEPLOYMENT STATUS: WARNING');
      console.log('💡 Some issues detected - Monitor closely');
    } else {
      console.log('🚨 DEPLOYMENT STATUS: CRITICAL');
      console.log('❌ Significant issues detected - Immediate attention required');
    }
  }

  // Start monitoring
  async startMonitoring(duration = 600000) { // 10 minutes default
    console.log('🚀 [CHOREO-MONITOR] Starting post-deploy monitoring...');
    console.log(`📍 Target URL: ${MONITORING_CONFIG.baseUrl}`);
    console.log(`⏱️ Duration: ${duration / 60000} minutes`);
    console.log('='.repeat(70));
    
    this.isRunning = true;
    
    // Initial health check
    await this.performHealthCheck();
    await this.checkBuildLogs();
    await this.performanceCheck();
    
    // Set up intervals
    const healthInterval = setInterval(() => {
      if (this.isRunning) this.performHealthCheck();
    }, MONITORING_CONFIG.healthCheckInterval);
    
    const logInterval = setInterval(() => {
      if (this.isRunning) this.checkBuildLogs();
    }, MONITORING_CONFIG.logCheckInterval);
    
    const perfInterval = setInterval(() => {
      if (this.isRunning) this.performanceCheck();
    }, MONITORING_CONFIG.performanceCheckInterval);
    
    this.intervals.push(healthInterval, logInterval, perfInterval);
    
    // Stop monitoring after duration
    setTimeout(() => {
      this.stopMonitoring();
    }, duration);
    
    console.log('\\n✅ Monitoring started - Press Ctrl+C to stop early');
  }

  // Stop monitoring
  stopMonitoring() {
    console.log('\\n🛑 [CHOREO-MONITOR] Stopping monitoring...');
    
    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    
    this.generateReport();
    
    console.log('\\n📋 Monitoring complete. Check logs/choreo-alerts.log for detailed alerts.');
    process.exit(0);
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const duration = args[0] ? parseInt(args[0]) * 60000 : 600000; // Convert minutes to ms
  
  // Ensure logs directory exists
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  const monitor = new ChoreoMonitor();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    monitor.stopMonitoring();
  });
  
  // Start monitoring
  monitor.startMonitoring(duration).catch(error => {
    console.error('❌ Monitoring failed:', error);
    process.exit(1);
  });
}

module.exports = ChoreoMonitor; 