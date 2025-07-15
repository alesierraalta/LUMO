const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Comprehensive Performance Test Suite
 * Tests API performance, cache efficiency, bundle analysis, and frontend metrics
 */

class ComprehensivePerformanceTest {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      timestamp: new Date().toISOString(),
      phase: 'Phase 2 - Next.js Configuration Optimizations',
      baseline: {
        // Phase 1 results for comparison
        inventory: { before: 3000, after: 640, improvement: '78.7%' },
        categories: { before: 3000, after: 408, improvement: '86.4%' },
        cacheStats: { before: 1000, after: 28, improvement: '97.2%' }
      },
      currentResults: {},
      bundleAnalysis: {},
      frontendMetrics: {},
      recommendations: []
    };
  }

  async testAPIPerformance() {
    console.log('📡 Comprehensive API Performance Testing...');
    
    const endpoints = [
      { path: '/api/inventory', label: 'Inventory API', iterations: 5 },
      { path: '/api/categories', label: 'Categories API', iterations: 5 },
      { path: '/api/cache-stats', label: 'Cache Stats API', iterations: 3 }
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🔍 Testing ${endpoint.label}...`);
      
      const results = [];
      
      for (let i = 0; i < endpoint.iterations; i++) {
        const startTime = Date.now();
        
        try {
          const response = await fetch(`${this.baseUrl}${endpoint.path}`);
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          results.push({
            iteration: i + 1,
            responseTime,
            status: response.status,
            success: response.ok
          });
          
          console.log(`   Iteration ${i + 1}: ${responseTime}ms - Status: ${response.status}`);
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`   Iteration ${i + 1}: ERROR - ${error.message}`);
          results.push({
            iteration: i + 1,
            responseTime: -1,
            status: 0,
            success: false,
            error: error.message
          });
        }
      }
      
      // Calculate statistics
      const successfulResults = results.filter(r => r.success);
      if (successfulResults.length > 0) {
        const responseTimes = successfulResults.map(r => r.responseTime);
        const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        const minResponseTime = Math.min(...responseTimes);
        const maxResponseTime = Math.max(...responseTimes);
        const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
        
        this.results.currentResults[endpoint.path] = {
          label: endpoint.label,
          iterations: endpoint.iterations,
          successRate: (successfulResults.length / results.length) * 100,
          avgResponseTime: Math.round(avgResponseTime),
          minResponseTime,
          maxResponseTime,
          p95ResponseTime,
          rawResults: results
        };
        
        console.log(`   ✅ Average: ${Math.round(avgResponseTime)}ms`);
        console.log(`   📊 Min: ${minResponseTime}ms | Max: ${maxResponseTime}ms | P95: ${p95ResponseTime}ms`);
      }
    }
  }

  async testCachePerformance() {
    console.log('\n🔄 Advanced Cache Performance Testing...');
    
    try {
      // Clear cache first
      await fetch(`${this.baseUrl}/api/cache-stats`, { method: 'DELETE', body: JSON.stringify({ action: 'clear' }) });
      console.log('🗑️  Cache cleared for testing');
      
      // Test cache miss (first request)
      console.log('\n🔍 Testing Cache Miss Performance...');
      const missResults = {};
      
      const endpoints = ['/api/inventory', '/api/categories'];
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        const endTime = Date.now();
        
        missResults[endpoint] = {
          responseTime: endTime - startTime,
          status: response.status
        };
        
        console.log(`   ${endpoint}: ${endTime - startTime}ms (cache miss)`);
      }
      
      // Test cache hit (second request)
      console.log('\n✅ Testing Cache Hit Performance...');
      const hitResults = {};
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        const endTime = Date.now();
        
        hitResults[endpoint] = {
          responseTime: endTime - startTime,
          status: response.status
        };
        
        console.log(`   ${endpoint}: ${endTime - startTime}ms (cache hit)`);
      }
      
      // Calculate cache efficiency
      const cacheEfficiency = {};
      for (const endpoint of endpoints) {
        const missTime = missResults[endpoint].responseTime;
        const hitTime = hitResults[endpoint].responseTime;
        const improvement = ((missTime - hitTime) / missTime) * 100;
        
        cacheEfficiency[endpoint] = {
          missTime,
          hitTime,
          improvement: Math.round(improvement * 100) / 100
        };
      }
      
      this.results.currentResults.cacheEfficiency = cacheEfficiency;
      
      // Get final cache stats
      const cacheStatsResponse = await fetch(`${this.baseUrl}/api/cache-stats`);
      if (cacheStatsResponse.ok) {
        const cacheData = await cacheStatsResponse.json();
        this.results.currentResults.cacheStats = cacheData.data;
      }
      
    } catch (error) {
      console.error('❌ Cache performance test failed:', error);
    }
  }

  async analyzeBundleSize() {
    console.log('\n📦 Bundle Analysis...');
    
    try {
      // Check if .next build exists
      const nextBuildPath = path.join(process.cwd(), '.next');
      if (!fs.existsSync(nextBuildPath)) {
        console.log('⚠️  No build found. Creating production build for analysis...');
        
        try {
          execSync('npm run build', { stdio: 'inherit' });
        } catch (error) {
          console.error('❌ Build failed:', error.message);
          return;
        }
      }
      
      // Analyze build directory
      const buildAnalysis = this.analyzeBuildDirectory();
      this.results.bundleAnalysis = buildAnalysis;
      
      console.log('📊 Bundle Analysis Results:');
      console.log(`   Total Build Size: ${buildAnalysis.totalSize}`);
      console.log(`   Static Files: ${buildAnalysis.staticFiles}`);
      console.log(`   Server Files: ${buildAnalysis.serverFiles}`);
      console.log(`   Pages: ${buildAnalysis.pages}`);
      
      // Generate bundle analyzer report
      console.log('\n🔍 Generating detailed bundle analysis...');
      try {
        execSync('npm run analyze', { stdio: 'inherit' });
        console.log('✅ Bundle analysis complete! Check opened browser tabs for detailed reports.');
      } catch (error) {
        console.log('⚠️  Bundle analyzer failed, but basic analysis completed');
      }
      
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error);
    }
  }

  analyzeBuildDirectory() {
    const nextBuildPath = path.join(process.cwd(), '.next');
    
    if (!fs.existsSync(nextBuildPath)) {
      return { error: 'Build directory not found' };
    }
    
    const analysis = {
      totalSize: 0,
      staticFiles: 0,
      serverFiles: 0,
      pages: 0,
      fileBreakdown: {}
    };
    
    const calculateDirSize = (dirPath) => {
      let totalSize = 0;
      
      try {
        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isDirectory()) {
            totalSize += calculateDirSize(filePath);
          } else {
            totalSize += stats.size;
          }
        }
      } catch (error) {
        // Ignore errors
      }
      
      return totalSize;
    };
    
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // Analyze key directories
    const keyDirs = ['static', 'server', 'cache'];
    
    for (const dir of keyDirs) {
      const dirPath = path.join(nextBuildPath, dir);
      if (fs.existsSync(dirPath)) {
        const size = calculateDirSize(dirPath);
        analysis.fileBreakdown[dir] = formatBytes(size);
        analysis.totalSize += size;
        
        if (dir === 'static') analysis.staticFiles = size;
        if (dir === 'server') analysis.serverFiles = size;
      }
    }
    
    analysis.totalSize = formatBytes(analysis.totalSize);
    analysis.staticFiles = formatBytes(analysis.staticFiles);
    analysis.serverFiles = formatBytes(analysis.serverFiles);
    
    return analysis;
  }

  async measureFrontendPerformance() {
    console.log('\n🌐 Frontend Performance Metrics...');
    
    // This would typically use tools like Lighthouse or Playwright
    // For now, we'll measure basic metrics
    const frontendMetrics = {
      nextjsVersion: this.getNextjsVersion(),
      reactVersion: this.getReactVersion(),
      optimizationsEnabled: this.checkOptimizations(),
      buildConfig: this.analyzeBuildConfig()
    };
    
    this.results.frontendMetrics = frontendMetrics;
    
    console.log('⚡ Frontend Configuration:');
    console.log(`   Next.js Version: ${frontendMetrics.nextjsVersion}`);
    console.log(`   React Version: ${frontendMetrics.reactVersion}`);
    console.log(`   Optimizations: ${frontendMetrics.optimizationsEnabled.length} enabled`);
    console.log(`   Build Config: ${frontendMetrics.buildConfig.length} optimizations`);
  }

  getNextjsVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
      return packageJson.dependencies.next || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  getReactVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
      return packageJson.dependencies.react || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  checkOptimizations() {
    const optimizations = [];
    
    try {
      const nextConfigPath = path.join(process.cwd(), 'next.config.js');
      if (fs.existsSync(nextConfigPath)) {
        const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
        
        if (nextConfig.includes('optimizePackageImports')) optimizations.push('Package Import Optimization');
        if (nextConfig.includes('webpackBuildWorker')) optimizations.push('Webpack Build Worker');
        if (nextConfig.includes('optimizeCss')) optimizations.push('CSS Optimization');
        if (nextConfig.includes('bundle-analyzer')) optimizations.push('Bundle Analyzer');
        if (nextConfig.includes('compress: true')) optimizations.push('Compression');
        if (nextConfig.includes('reactStrictMode: true')) optimizations.push('React Strict Mode');
      }
    } catch (error) {
      // Ignore errors
    }
    
    return optimizations;
  }

  analyzeBuildConfig() {
    const buildOptimizations = [];
    
    try {
      const nextConfigPath = path.join(process.cwd(), 'next.config.js');
      if (fs.existsSync(nextConfigPath)) {
        const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
        
        if (nextConfig.includes('splitChunks')) buildOptimizations.push('Code Splitting');
        if (nextConfig.includes('productionBrowserSourceMaps: false')) buildOptimizations.push('Source Maps Disabled');
        if (nextConfig.includes('output: \'standalone\'')) buildOptimizations.push('Standalone Output');
        if (nextConfig.includes('poweredByHeader: false')) buildOptimizations.push('Security Headers');
        if (nextConfig.includes('image')) buildOptimizations.push('Image Optimization');
      }
    } catch (error) {
      // Ignore errors
    }
    
    return buildOptimizations;
  }

  generateRecommendations() {
    console.log('\n💡 Performance Recommendations...');
    
    const recommendations = [];
    
    // API Performance recommendations
    const apiResults = this.results.currentResults;
    for (const [endpoint, result] of Object.entries(apiResults)) {
      if (endpoint.startsWith('/api/') && result.avgResponseTime) {
        if (result.avgResponseTime > 1000) {
          recommendations.push({
            type: 'API Performance',
            priority: 'High',
            message: `${result.label} response time (${result.avgResponseTime}ms) exceeds 1000ms threshold`,
            solution: 'Consider database query optimization, caching improvements, or response pagination'
          });
        } else if (result.avgResponseTime > 500) {
          recommendations.push({
            type: 'API Performance',
            priority: 'Medium',
            message: `${result.label} response time (${result.avgResponseTime}ms) could be improved`,
            solution: 'Review database queries and consider additional caching strategies'
          });
        }
      }
    }
    
    // Cache Performance recommendations
    if (this.results.currentResults.cacheStats) {
      const combined = this.results.currentResults.cacheStats.combined;
      if (combined.hitRate < 50) {
        recommendations.push({
          type: 'Cache Performance',
          priority: 'High',
          message: `Cache hit rate (${combined.hitRate}%) is below optimal threshold`,
          solution: 'Review cache TTL settings and ensure proper cache key generation'
        });
      } else if (combined.hitRate < 70) {
        recommendations.push({
          type: 'Cache Performance',
          priority: 'Medium',
          message: `Cache hit rate (${combined.hitRate}%) has room for improvement`,
          solution: 'Consider increasing cache TTL for stable data and optimizing cache strategies'
        });
      }
    }
    
    // Bundle recommendations
    if (this.results.bundleAnalysis && this.results.bundleAnalysis.totalSize) {
      recommendations.push({
        type: 'Bundle Optimization',
        priority: 'Low',
        message: 'Consider Phase 3 optimizations for further improvements',
        solution: 'Implement CDN caching, Redis for distributed caching, and database indexing'
      });
    }
    
    this.results.recommendations = recommendations;
    
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority}] ${rec.type}: ${rec.message}`);
      console.log(`   💡 Solution: ${rec.solution}`);
    });
  }

  async saveReport() {
    const reportPath = path.join(process.cwd(), 'reports', `comprehensive-performance-${new Date().toISOString().split('T')[0]}.json`);
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`\n📄 Comprehensive report saved to: ${reportPath}`);
      return reportPath;
    } catch (error) {
      console.error('❌ Failed to save report:', error);
      return null;
    }
  }

  async run() {
    console.log('🚀 Comprehensive Performance Test Suite');
    console.log('=' .repeat(60));
    console.log(`📅 Date: ${new Date().toLocaleString()}`);
    console.log(`🎯 Phase: ${this.results.phase}`);
    console.log('=' .repeat(60));
    
    try {
      await this.testAPIPerformance();
      await this.testCachePerformance();
      await this.analyzeBundleSize();
      await this.measureFrontendPerformance();
      this.generateRecommendations();
      
      await this.saveReport();
      
      console.log('\n🎉 Comprehensive Performance Test Complete!');
      console.log('\n📊 Summary:');
      console.log('   ✅ API Performance tested');
      console.log('   ✅ Cache efficiency analyzed');
      console.log('   ✅ Bundle size analyzed');
      console.log('   ✅ Frontend metrics collected');
      console.log('   ✅ Recommendations generated');
      
    } catch (error) {
      console.error('❌ Comprehensive performance test failed:', error);
      process.exit(1);
    }
  }
}

// Run comprehensive performance test
async function main() {
  const test = new ComprehensivePerformanceTest();
  await test.run();
}

if (require.main === module) {
  main();
}

module.exports = ComprehensivePerformanceTest;