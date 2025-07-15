const fs = require('fs');
const path = require('path');

/**
 * Performance Monitor - Real-time performance tracking
 * Tracks API response times, cache performance, and system metrics
 */

class PerformanceMonitor {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.metrics = {
      api: {},
      cache: {},
      system: {},
      timestamp: new Date().toISOString()
    };
  }

  async testAPI(endpoint, label) {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();
    
    try {
      const response = await fetch(url);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const result = {
        endpoint,
        responseTime,
        status: response.status,
        success: response.ok,
        timestamp: new Date().toISOString()
      };
      
      console.log(`📡 ${label}: ${responseTime}ms - Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
      return result;
    } catch (error) {
      console.error(`❌ ${label} failed:`, error.message);
      return {
        endpoint,
        responseTime: -1,
        status: 0,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getCacheStats() {
    try {
      const response = await fetch(`${this.baseUrl}/api/cache-stats`);
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return null;
    }
  }

  async getSystemMetrics() {
    const nextBuildPath = path.join(process.cwd(), '.next');
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const buildExists = fs.existsSync(nextBuildPath);
      
      let buildStats = null;
      if (buildExists) {
        try {
          const buildStatPath = path.join(nextBuildPath, 'build-manifest.json');
          if (fs.existsSync(buildStatPath)) {
            buildStats = JSON.parse(fs.readFileSync(buildStatPath, 'utf8'));
          }
        } catch (e) {
          // Build stats not available
        }
      }
      
      return {
        nextVersion: packageJson.dependencies?.next || 'unknown',
        buildExists,
        buildStats,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      };
    } catch (error) {
      console.error('❌ Failed to get system metrics:', error);
      return null;
    }
  }

  async runPerformanceTest() {
    console.log('🚀 Performance Monitor - Real-time Performance Tracking');
    console.log('=' .repeat(60));
    
    // Test API endpoints
    console.log('\n📡 Testing API Performance...');
    const apiTests = [
      { endpoint: '/api/inventory', label: 'Inventory API' },
      { endpoint: '/api/categories', label: 'Categories API' },
      { endpoint: '/api/cache-stats', label: 'Cache Stats API' }
    ];
    
    for (const test of apiTests) {
      const result = await this.testAPI(test.endpoint, test.label);
      this.metrics.api[test.endpoint] = result;
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }
    
    // Get cache performance
    console.log('\n📊 Analyzing Cache Performance...');
    const cacheStats = await this.getCacheStats();
    if (cacheStats) {
      this.metrics.cache = cacheStats;
      
      console.log('🔄 Combined Cache Performance:');
      console.log(`   Total Requests: ${cacheStats.combined.totalRequests}`);
      console.log(`   Cache Hits: ${cacheStats.combined.hits}`);
      console.log(`   Cache Misses: ${cacheStats.combined.misses}`);
      console.log(`   Hit Rate: ${cacheStats.combined.hitRate}%`);
      console.log(`   Total Cache Size: ${cacheStats.combined.totalSize} entries`);
      
      console.log('\n🔐 Auth Cache:');
      console.log(`   Hits: ${cacheStats.authCache.hits} | Misses: ${cacheStats.authCache.misses}`);
      console.log(`   Hit Rate: ${cacheStats.authCache.hitRate}% | Size: ${cacheStats.authCache.size}`);
      
      console.log('\n📦 Response Cache:');
      console.log(`   Hits: ${cacheStats.responseCache.hits} | Misses: ${cacheStats.responseCache.misses}`);
      console.log(`   Hit Rate: ${cacheStats.responseCache.hitRate}% | Size: ${cacheStats.responseCache.size}`);
    }
    
    // Get system metrics
    console.log('\n🖥️  System Metrics...');
    const systemMetrics = await this.getSystemMetrics();
    if (systemMetrics) {
      this.metrics.system = systemMetrics;
      
      console.log(`   Next.js Version: ${systemMetrics.nextVersion}`);
      console.log(`   Node.js Version: ${systemMetrics.nodeVersion}`);
      console.log(`   Build Available: ${systemMetrics.buildExists ? '✅' : '❌'}`);
      console.log(`   Memory Usage: ${Math.round(systemMetrics.memoryUsage.used / 1024 / 1024)}MB`);
      console.log(`   Uptime: ${Math.round(systemMetrics.uptime)}s`);
    }
    
    // Performance Summary
    console.log('\n📈 Performance Summary:');
    console.log('=' .repeat(40));
    
    const apiResults = Object.values(this.metrics.api);
    const successfulAPIs = apiResults.filter(r => r.success);
    
    if (successfulAPIs.length > 0) {
      const avgResponseTime = successfulAPIs.reduce((sum, r) => sum + r.responseTime, 0) / successfulAPIs.length;
      const maxResponseTime = Math.max(...successfulAPIs.map(r => r.responseTime));
      const minResponseTime = Math.min(...successfulAPIs.map(r => r.responseTime));
      
      console.log(`📊 API Performance:`);
      console.log(`   Average Response Time: ${Math.round(avgResponseTime)}ms`);
      console.log(`   Fastest Response: ${minResponseTime}ms`);
      console.log(`   Slowest Response: ${maxResponseTime}ms`);
      console.log(`   Success Rate: ${(successfulAPIs.length / apiResults.length * 100).toFixed(1)}%`);
      
      // Performance grade
      let grade = 'F';
      if (avgResponseTime < 200) grade = 'A';
      else if (avgResponseTime < 500) grade = 'B';
      else if (avgResponseTime < 1000) grade = 'C';
      else if (avgResponseTime < 2000) grade = 'D';
      
      console.log(`   Performance Grade: ${grade} ${grade === 'A' ? '🌟' : grade === 'B' ? '✅' : grade === 'C' ? '⚠️' : '❌'}`);
    }
    
    if (cacheStats) {
      console.log(`📊 Cache Performance:`);
      console.log(`   Overall Hit Rate: ${cacheStats.combined.hitRate}%`);
      console.log(`   Cache Efficiency: ${cacheStats.combined.hitRate > 70 ? '🌟 Excellent' : cacheStats.combined.hitRate > 50 ? '✅ Good' : cacheStats.combined.hitRate > 30 ? '⚠️ Fair' : '❌ Poor'}`);
    }
    
    return this.metrics;
  }

  async saveReport(filename = 'performance-report.json') {
    const reportPath = path.join(process.cwd(), 'reports', filename);
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(this.metrics, null, 2));
      console.log(`\n📄 Performance report saved to: ${reportPath}`);
      return reportPath;
    } catch (error) {
      console.error('❌ Failed to save performance report:', error);
      return null;
    }
  }
}

// Run performance monitor
async function main() {
  const monitor = new PerformanceMonitor();
  
  try {
    await monitor.runPerformanceTest();
    await monitor.saveReport(`performance-monitor-${new Date().toISOString().split('T')[0]}.json`);
    
    console.log('\n🎯 Performance Monitoring Complete!');
    console.log('💡 Tips for further optimization:');
    console.log('   • Run "npm run analyze" for detailed bundle analysis');
    console.log('   • Monitor cache hit rates - aim for >70%');
    console.log('   • Keep API response times under 500ms');
    console.log('   • Use "npm run performance:full" for comprehensive testing');
    
  } catch (error) {
    console.error('❌ Performance monitoring failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = PerformanceMonitor;