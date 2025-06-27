#!/usr/bin/env node

/**
 * SUPABASE BUILD FIX MONITORING
 * Specific monitoring for ultra build fix verification
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class SupabaseBuildFixMonitor {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = {
      timestamp: new Date().toISOString(),
      buildFixWorking: false,
      supabaseErrors: [],
      endpointTests: [],
      buildVerification: null,
      recommendations: []
    };
  }

  async makeRequest(url) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Choose HTTP or HTTPS based on URL protocol
      const client = url.startsWith('https:') ? https : http;
      
      const req = client.get(url, { timeout: 10000 }, (res) => {
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
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  // Test critical endpoints for Supabase errors
  async testEndpoints() {
    console.log('🔍 [SUPABASE-FIX] Testing endpoints for Supabase configuration errors...');
    
    const endpoints = [
      { path: '/api/health', critical: true },
      { path: '/api/categories', critical: true },
      { path: '/api/auth/me', critical: false },
      { path: '/', critical: false }
    ];
    
    for (const endpoint of endpoints) {
      const url = this.baseUrl + endpoint.path;
      
      try {
        console.log(`   🧪 Testing: ${endpoint.path}`);
        
        const result = await this.makeRequest(url);
        
        // Check for Supabase build errors in response
        const hasSupabaseError = result.data.includes('Missing Supabase configuration') ||
                                result.data.includes('Failed to collect page data') ||
                                result.data.includes('Supabase client not initialized');
        
        const testResult = {
          endpoint: endpoint.path,
          statusCode: result.statusCode,
          responseTime: result.responseTime,
          hasSupabaseError,
          critical: endpoint.critical,
          success: result.statusCode >= 200 && result.statusCode < 400 && !hasSupabaseError
        };
        
        if (hasSupabaseError) {
          console.log(`   ❌ ${endpoint.path}: Supabase error detected!`);
          this.results.supabaseErrors.push({
            endpoint: endpoint.path,
            error: 'Supabase configuration error in response'
          });
        } else if (testResult.success) {
          console.log(`   ✅ ${endpoint.path}: OK (${result.responseTime}ms)`);
        } else {
          console.log(`   ⚠️ ${endpoint.path}: HTTP ${result.statusCode}`);
        }
        
        this.results.endpointTests.push(testResult);
        
      } catch (error) {
        console.log(`   ❌ ${endpoint.path}: ${error.message}`);
        
        this.results.endpointTests.push({
          endpoint: endpoint.path,
          error: error.message,
          critical: endpoint.critical,
          success: false
        });
        
        if (error.message.includes('Supabase') || error.message.includes('configuration')) {
          this.results.supabaseErrors.push({
            endpoint: endpoint.path,
            error: error.message
          });
        }
      }
    }
  }

  // Verify build fix implementation
  async verifyBuildFix() {
    console.log('\\n🔧 [BUILD-FIX] Verifying ultra build fix implementation...');
    
    try {
      // Test health endpoint for build detection headers
      const healthUrl = this.baseUrl + '/api/health';
      const result = await this.makeRequest(healthUrl);
      
      const verification = {
        healthEndpointWorking: result.statusCode === 200,
        noBuildErrors: !result.data.includes('Missing Supabase configuration'),
        responseTime: result.responseTime,
        buildDetectionWorking: true // Assume working if no errors
      };
      
      // Check response headers for build information
      if (result.headers['x-build-mode']) {
        verification.buildModeDetected = result.headers['x-build-mode'];
      }
      
      if (result.data.includes('"status":"healthy"')) {
        verification.healthResponseValid = true;
      }
      
      this.results.buildVerification = verification;
      
      if (verification.healthEndpointWorking && verification.noBuildErrors) {
        console.log('   ✅ Build fix verification: PASSED');
        console.log(`   ⚡ Response time: ${verification.responseTime}ms`);
      } else {
        console.log('   ❌ Build fix verification: FAILED');
        if (!verification.healthEndpointWorking) {
          console.log('   ❌ Health endpoint not responding');
        }
        if (!verification.noBuildErrors) {
          console.log('   ❌ Build errors still present');
        }
      }
      
    } catch (error) {
      console.log('   ❌ Build fix verification failed:', error.message);
      this.results.buildVerification = {
        error: error.message,
        success: false
      };
    }
  }

  // Analyze results and generate recommendations
  analyzeResults() {
    console.log('\\n📊 [ANALYSIS] Analyzing monitoring results...');
    
    const criticalEndpointTests = this.results.endpointTests.filter(test => test.critical);
    const criticalFailures = criticalEndpointTests.filter(test => !test.success);
    const hasSupabaseErrors = this.results.supabaseErrors.length > 0;
    
    // Determine if build fix is working
    this.results.buildFixWorking = 
      criticalFailures.length === 0 && 
      !hasSupabaseErrors && 
      this.results.buildVerification && 
      this.results.buildVerification.healthEndpointWorking;
    
    // Generate recommendations
    if (hasSupabaseErrors) {
      this.results.recommendations.push({
        priority: 'HIGH',
        issue: 'Supabase configuration errors detected',
        action: 'The ultra build fix may not be working properly. Check build logs and verify environment variables.'
      });
    }
    
    if (criticalFailures.length > 0) {
      this.results.recommendations.push({
        priority: 'HIGH',
        issue: `${criticalFailures.length} critical endpoint(s) failing`,
        action: 'Check application logs and verify deployment configuration.'
      });
    }
    
    if (this.results.buildVerification && !this.results.buildVerification.healthEndpointWorking) {
      this.results.recommendations.push({
        priority: 'CRITICAL',
        issue: 'Health endpoint not responding',
        action: 'Application may not be running. Check Choreo deployment status and container logs.'
      });
    }
    
    const avgResponseTime = this.results.endpointTests
      .filter(test => test.responseTime)
      .reduce((sum, test) => sum + test.responseTime, 0) / 
      this.results.endpointTests.filter(test => test.responseTime).length;
    
    if (avgResponseTime > 3000) {
      this.results.recommendations.push({
        priority: 'MEDIUM',
        issue: `Slow response times (avg: ${Math.round(avgResponseTime)}ms)`,
        action: 'Consider optimizing application performance or checking resource allocation.'
      });
    }
    
    if (this.results.recommendations.length === 0) {
      this.results.recommendations.push({
        priority: 'INFO',
        issue: 'All checks passed',
        action: 'Ultra build fix is working correctly. Continue monitoring.'
      });
    }
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\\n' + '='.repeat(80));
    console.log('📋 SUPABASE BUILD FIX MONITORING REPORT');
    console.log('='.repeat(80));
    console.log(`🕐 Timestamp: ${this.results.timestamp}`);
    console.log(`📍 Target URL: ${this.baseUrl}`);
    console.log('');
    
    // Build Fix Status
    console.log('🔧 BUILD FIX STATUS:');
    if (this.results.buildFixWorking) {
      console.log('   ✅ WORKING - Ultra build fix is functioning correctly');
    } else {
      console.log('   ❌ ISSUES DETECTED - Build fix may need attention');
    }
    console.log('');
    
    // Endpoint Tests
    console.log('🧪 ENDPOINT TESTS:');
    this.results.endpointTests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      const critical = test.critical ? '[CRITICAL]' : '[NON-CRITICAL]';
      console.log(`   ${status} ${test.endpoint} ${critical}`);
      if (test.responseTime) {
        console.log(`      Response time: ${test.responseTime}ms`);
      }
      if (test.error) {
        console.log(`      Error: ${test.error}`);
      }
    });
    console.log('');
    
    // Supabase Errors
    if (this.results.supabaseErrors.length > 0) {
      console.log('🚨 SUPABASE ERRORS DETECTED:');
      this.results.supabaseErrors.forEach(error => {
        console.log(`   ❌ ${error.endpoint}: ${error.error}`);
      });
      console.log('');
    }
    
    // Build Verification
    if (this.results.buildVerification) {
      console.log('🔍 BUILD VERIFICATION:');
      const bv = this.results.buildVerification;
      console.log(`   Health Endpoint: ${bv.healthEndpointWorking ? '✅' : '❌'}`);
      console.log(`   No Build Errors: ${bv.noBuildErrors ? '✅' : '❌'}`);
      if (bv.responseTime) {
        console.log(`   Response Time: ${bv.responseTime}ms`);
      }
      console.log('');
    }
    
    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    this.results.recommendations.forEach(rec => {
      const priority = rec.priority === 'CRITICAL' ? '🚨' : 
                      rec.priority === 'HIGH' ? '⚠️' : 
                      rec.priority === 'MEDIUM' ? '💡' : '✅';
      console.log(`   ${priority} [${rec.priority}] ${rec.issue}`);
      console.log(`      Action: ${rec.action}`);
    });
    console.log('');
    
    // Final Status
    console.log('🎯 FINAL STATUS:');
    if (this.results.buildFixWorking) {
      console.log('   🎉 SUCCESS: Ultra build fix is working correctly!');
      console.log('   ✅ No Supabase configuration errors detected');
      console.log('   ✅ All critical endpoints responding');
      console.log('   ✅ Build verification passed');
    } else {
      console.log('   ⚠️ ATTENTION NEEDED: Issues detected with build fix');
      console.log('   📋 Review recommendations above');
      console.log('   🔧 May need to check deployment configuration');
    }
    
    console.log('='.repeat(80));
    
    return this.results;
  }

  // Save results to file
  saveResults() {
    const resultsFile = path.join(__dirname, '../logs/supabase-fix-monitoring.json');
    const reportFile = path.join(__dirname, '../logs/supabase-fix-report.txt');
    
    try {
      // Save JSON results
      fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
      console.log(`\\n💾 Results saved to: ${resultsFile}`);
      
      // Save text report
      const reportContent = `SUPABASE BUILD FIX MONITORING REPORT
Generated: ${this.results.timestamp}
Target URL: ${this.baseUrl}

BUILD FIX STATUS: ${this.results.buildFixWorking ? 'WORKING' : 'ISSUES DETECTED'}

ENDPOINT TESTS:
${this.results.endpointTests.map(test => 
  `${test.success ? '✅' : '❌'} ${test.endpoint} ${test.critical ? '[CRITICAL]' : '[NON-CRITICAL]'}${test.error ? ' - ' + test.error : ''}`
).join('\\n')}

SUPABASE ERRORS: ${this.results.supabaseErrors.length}
${this.results.supabaseErrors.map(error => `❌ ${error.endpoint}: ${error.error}`).join('\\n')}

RECOMMENDATIONS:
${this.results.recommendations.map(rec => `[${rec.priority}] ${rec.issue} - ${rec.action}`).join('\\n')}

FINAL STATUS: ${this.results.buildFixWorking ? 'SUCCESS' : 'ATTENTION NEEDED'}
`;
      
      fs.writeFileSync(reportFile, reportContent);
      console.log(`📄 Report saved to: ${reportFile}`);
      
    } catch (error) {
      console.log('⚠️ Failed to save results:', error.message);
    }
  }

  // Run complete monitoring
  async runMonitoring() {
    console.log('🚀 [SUPABASE-FIX-MONITOR] Starting Supabase build fix verification...');
    console.log(`📍 Target: ${this.baseUrl}`);
    console.log('='.repeat(80));
    
    try {
      await this.testEndpoints();
      await this.verifyBuildFix();
      this.analyzeResults();
      const results = this.generateReport();
      this.saveResults();
      
      return results;
      
    } catch (error) {
      console.error('❌ Monitoring failed:', error);
      throw error;
    }
  }
}

// CLI Usage
if (require.main === module) {
  const baseUrl = process.argv[2] || process.env.CHOREO_APP_URL;
  
  if (!baseUrl) {
    console.error('❌ Error: Please provide Choreo app URL');
    console.log('Usage: node scripts/monitor-supabase-fix.js <CHOREO_URL>');
    console.log('Or set CHOREO_APP_URL environment variable');
    process.exit(1);
  }
  
  // Ensure logs directory exists
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  const monitor = new SupabaseBuildFixMonitor(baseUrl);
  
  monitor.runMonitoring().then(results => {
    process.exit(results.buildFixWorking ? 0 : 1);
  }).catch(error => {
    console.error('❌ Monitoring failed:', error);
    process.exit(1);
  });
}

module.exports = SupabaseBuildFixMonitor; 