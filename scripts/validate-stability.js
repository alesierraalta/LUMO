#!/usr/bin/env node

/**
 * Server Stability Validator for LUMO Choreo Deployment
 */

const http = require('http');
const { performance } = require('perf_hooks');

class ServerStabilityValidator {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      uptime: 0,
      memoryUsage: [],
      cpuUsage: [],
      errorCount: 0,
      requestCount: 0,
      healthCheckResults: []
    };
    this.isRunning = false;
  }

  async validateStability() {
    console.log('🔍 Starting server stability validation...');
    this.isRunning = true;
    
    // Start monitoring
    const monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000);
    
    // Health check interval
    const healthInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000);
    
    // Run for 5 minutes
    setTimeout(() => {
      clearInterval(monitoringInterval);
      clearInterval(healthInterval);
      this.generateReport();
      this.isRunning = false;
    }, 300000);
    
    console.log('📊 Monitoring server stability for 5 minutes...');
  }

  collectMetrics() {
    const usage = process.memoryUsage();
    const uptime = process.uptime();
    
    this.metrics.uptime = uptime;
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      rss: usage.rss,
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external
    });
    
    // Check for memory leaks
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 4096) {
      console.warn(`⚠️  HIGH MEMORY USAGE: ${heapUsedMB.toFixed(2)}MB`);
      this.metrics.errorCount++;
    }
    
    // Log current status
    if (this.metrics.memoryUsage.length % 12 === 0) { // Every minute
      console.log(`📈 Uptime: ${Math.floor(uptime)}s, Memory: ${heapUsedMB.toFixed(2)}MB`);
    }
  }

  async performHealthChecks() {
    const endpoints = ['/api/health', '/', '/dashboard'];
    
    for (const endpoint of endpoints) {
      try {
        const result = await this.checkEndpoint(endpoint);
        this.metrics.healthCheckResults.push(result);
        
        if (result.status !== 200) {
          console.warn(`⚠️  Health check failed: ${endpoint} - ${result.status}`);
          this.metrics.errorCount++;
        }
      } catch (error) {
        console.error(`❌ Health check error: ${endpoint} - ${error.message}`);
        this.metrics.errorCount++;
      }
    }
  }

  checkEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const req = http.get(`http://localhost:3000${endpoint}`, (res) => {
        const endTime = performance.now();
        resolve({
          endpoint,
          status: res.statusCode,
          responseTime: endTime - startTime,
          timestamp: Date.now()
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  generateReport() {
    console.log('\n📋 SERVER STABILITY REPORT');
    console.log('================================');
    
    const avgMemory = this.metrics.memoryUsage.reduce((sum, m) => sum + m.heapUsed, 0) / this.metrics.memoryUsage.length;
    const maxMemory = Math.max(...this.metrics.memoryUsage.map(m => m.heapUsed));
    
    console.log(`⏱️  Total Uptime: ${Math.floor(this.metrics.uptime)} seconds`);
    console.log(`💾 Average Memory: ${(avgMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📊 Peak Memory: ${(maxMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`❌ Error Count: ${this.metrics.errorCount}`);
    console.log(`✅ Health Checks: ${this.metrics.healthCheckResults.length}`);
    
    // Stability assessment
    const isStable = this.metrics.errorCount < 5 && (maxMemory / 1024 / 1024) < 4096;
    console.log(`\n🎯 STABILITY STATUS: ${isStable ? '✅ STABLE' : '❌ UNSTABLE'}`);
    
    if (isStable) {
      console.log('✅ Server is ready for production deployment');
    } else {
      console.log('⚠️  Server stability issues detected - review logs');
    }
    
    return {
      stable: isStable,
      uptime: this.metrics.uptime,
      averageMemory: avgMemory,
      peakMemory: maxMemory,
      errorCount: this.metrics.errorCount
    };
  }
}

// Start validation if run directly
if (require.main === module) {
  const validator = new ServerStabilityValidator();
  validator.validateStability().catch(console.error);
}

module.exports = ServerStabilityValidator;
