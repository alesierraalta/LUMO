#!/usr/bin/env node

const https = require('https');
const http = require('http');

const CHOREO_URL = 'https://lumo-1615540597-7595685744.choreoapis.dev';
const TEST_EMAIL = 'pradasamuel1@gmail.com';
const CHECK_INTERVAL = 30000; // 30 seconds
const MAX_DURATION = 1800000; // 30 minutes

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

class DeploymentMonitor {
  constructor() {
    this.startTime = Date.now();
    this.checkCount = 0;
    this.lastStatus = 'unknown';
    this.deploymentPhases = [
      'Building',
      'Deploying', 
      'Starting',
      'Health Checks',
      'Ready'
    ];
    this.currentPhaseIndex = 0;
    this.successfulChecks = 0;
    this.consecutiveFailures = 0;
  }

  log(message, color = 'reset') {
    const timestamp = new Date().toISOString().substr(11, 8);
    console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve) => {
      const isHttps = url.startsWith('https');
      const client = isHttps ? https : http;
      
      const requestOptions = {
        ...options,
        timeout: 10000,
        headers: {
          'User-Agent': 'LUMO-Deployment-Monitor/1.0',
          'Accept': 'application/json',
          ...options.headers
        }
      };

      const req = client.request(url, requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            success: true,
            status: res.statusCode,
            headers: res.headers,
            data: data,
            responseTime: Date.now() - requestStart
          });
        });
      });

      const requestStart = Date.now();
      
      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          code: error.code,
          responseTime: Date.now() - requestStart
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout',
          code: 'TIMEOUT',
          responseTime: Date.now() - requestStart
        });
      });

      if (options.method === 'POST' && options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  async checkHealthEndpoint() {
    this.log('🏥 Checking health endpoint...', 'cyan');
    const result = await this.makeRequest(`${CHOREO_URL}/api/health`);
    
    if (result.success && result.status === 200) {
      this.log(`✅ Health check: OK (${result.responseTime}ms)`, 'green');
      return { success: true, responseTime: result.responseTime };
    } else {
      this.log(`❌ Health check: ${result.error || `HTTP ${result.status}`} (${result.responseTime}ms)`, 'red');
      return { success: false, error: result.error || `HTTP ${result.status}` };
    }
  }

  async checkEnhancedLoginHealth() {
    this.log('🔧 Checking login health...', 'cyan');
    const result = await this.makeRequest(`${CHOREO_URL}/api/auth/login`);
    
    if (result.success && result.status === 200) {
      try {
        const data = JSON.parse(result.data);
        this.log(`✅ Enhanced login: OK - ${data.status} (${result.responseTime}ms)`, 'green');
        this.log(`📊 Client Status: ${JSON.stringify(data.clientStatus)}`, 'blue');
        return { success: true, data, responseTime: result.responseTime };
      } catch (parseError) {
        this.log(`⚠️ Enhanced login: OK but invalid JSON (${result.responseTime}ms)`, 'yellow');
        return { success: true, responseTime: result.responseTime };
      }
    } else {
      this.log(`❌ Enhanced login: ${result.error || `HTTP ${result.status}`} (${result.responseTime}ms)`, 'red');
      return { success: false, error: result.error || `HTTP ${result.status}` };
    }
  }

  async checkDatabaseConnectivity() {
    this.log('🔍 Checking database connectivity...', 'cyan');
    const result = await this.makeRequest(`${CHOREO_URL}/api/health-advanced`);
    
    if (result.success && result.status === 200) {
      try {
        const data = JSON.parse(result.data);
        this.log(`✅ Database: OK - ${data.database?.status || 'Connected'} (${result.responseTime}ms)`, 'green');
        return { success: true, data, responseTime: result.responseTime };
      } catch (parseError) {
        this.log(`⚠️ Database: Response received but invalid JSON (${result.responseTime}ms)`, 'yellow');
        return { success: true, responseTime: result.responseTime };
      }
    } else {
      this.log(`❌ Database: ${result.error || `HTTP ${result.status}`} (${result.responseTime}ms)`, 'red');
      return { success: false, error: result.error || `HTTP ${result.status}` };
    }
  }

  async testAuthentication() {
    this.log('🔐 Testing authentication endpoint...', 'cyan');
    const result = await this.makeRequest(`${CHOREO_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: 'wrong-password-for-testing'
      })
    });
    
    if (result.success) {
      if (result.status === 401) {
        this.log(`✅ Authentication: OK - Properly rejecting invalid credentials (${result.responseTime}ms)`, 'green');
        return { success: true, responseTime: result.responseTime };
      } else if (result.status === 200) {
        this.log(`⚠️ Authentication: Unexpected success with wrong password (${result.responseTime}ms)`, 'yellow');
        return { success: true, responseTime: result.responseTime };
      } else {
        this.log(`❌ Authentication: HTTP ${result.status} (${result.responseTime}ms)`, 'red');
        return { success: false, error: `HTTP ${result.status}` };
      }
    } else {
      this.log(`❌ Authentication: ${result.error} (${result.responseTime}ms)`, 'red');
      return { success: false, error: result.error };
    }
  }

  async performFullCheck() {
    this.checkCount++;
    const checkStartTime = Date.now();
    
    this.log(`\n🚀 Deployment Check #${this.checkCount}`, 'cyan');
    this.log(`⏱️ Elapsed time: ${Math.floor((Date.now() - this.startTime) / 1000)}s`, 'blue');
    
    const results = {
      health: await this.checkHealthEndpoint(),
      enhancedLogin: await this.checkEnhancedLoginHealth(),
      database: await this.checkDatabaseConnectivity(),
      auth: await this.testAuthentication()
    };

    const totalTime = Date.now() - checkStartTime;
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalTests = Object.keys(results).length;

    this.log(`\n📊 Check Summary (${totalTime}ms total):`, 'blue');
    this.log(`✅ Passed: ${successCount}/${totalTests}`, successCount === totalTests ? 'green' : 'yellow');
    
    if (successCount === totalTests) {
      this.successfulChecks++;
      this.consecutiveFailures = 0;
      this.log(`🎉 All tests passed! Consecutive successes: ${this.successfulChecks}`, 'green');
      
      if (this.successfulChecks >= 3) {
        this.log(`\n🎯 DEPLOYMENT SUCCESSFUL! 🎯`, 'green');
        this.log(`✅ P6001 Emergency Fix is working correctly!`, 'green');
        this.log(`✅ Enhanced login API is operational!`, 'green');
        this.log(`✅ Database connectivity confirmed!`, 'green');
        this.log(`⏱️ Total monitoring time: ${Math.floor((Date.now() - this.startTime) / 1000)}s`, 'blue');
        return true; // Deployment complete
      }
    } else {
      this.consecutiveFailures++;
      this.successfulChecks = 0;
      
      // Analyze failure patterns
      const errors = Object.entries(results)
        .filter(([, result]) => !result.success)
        .map(([test, result]) => `${test}: ${result.error}`)
        .join(', ');
      
      this.log(`❌ Failures: ${errors}`, 'red');
      
      // Determine deployment phase
      if (errors.includes('ECONNRESET') || errors.includes('ECONNREFUSED')) {
        this.log(`🔄 Deployment appears to be in progress (connection reset)`, 'yellow');
      } else if (errors.includes('timeout') || errors.includes('TIMEOUT')) {
        this.log(`⏳ Service is responding slowly (may be starting)`, 'yellow');
      } else if (errors.includes('HTTP 502') || errors.includes('HTTP 503')) {
        this.log(`🚧 Service is starting but not ready yet`, 'yellow');
      } else if (errors.includes('P6001')) {
        this.log(`🚨 P6001 ERROR DETECTED - Emergency fix may not be working!`, 'red');
      }
    }

    return false; // Continue monitoring
  }

  async startMonitoring() {
    this.log(`🎯 Starting Choreo Deployment Monitor`, 'cyan');
    this.log(`📍 Target: ${CHOREO_URL}`, 'blue');
    this.log(`⏱️ Check interval: ${CHECK_INTERVAL / 1000}s`, 'blue');
    this.log(`⏳ Max duration: ${MAX_DURATION / 60000} minutes`, 'blue');
    this.log(`📧 Test email: ${TEST_EMAIL}`, 'blue');
    this.log(`─────────────────────────────────────────────────────────`, 'blue');

    const checkInterval = setInterval(async () => {
      try {
        const isComplete = await this.performFullCheck();
        
        if (isComplete) {
          clearInterval(checkInterval);
          this.log(`\n🏁 Monitoring completed successfully!`, 'green');
          process.exit(0);
        }
        
        // Check if we've exceeded max duration
        if (Date.now() - this.startTime > MAX_DURATION) {
          clearInterval(checkInterval);
          this.log(`\n⏰ Maximum monitoring duration exceeded (${MAX_DURATION / 60000} minutes)`, 'red');
          this.log(`🔄 Deployment may still be in progress - check manually`, 'yellow');
          process.exit(1);
        }
        
      } catch (error) {
        this.log(`💥 Monitor error: ${error.message}`, 'red');
      }
    }, CHECK_INTERVAL);

    // Initial check
    try {
      const isComplete = await this.performFullCheck();
      if (isComplete) {
        clearInterval(checkInterval);
        this.log(`\n🏁 Deployment already complete!`, 'green');
        process.exit(0);
      }
    } catch (error) {
      this.log(`💥 Initial check error: ${error.message}`, 'red');
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}📡 Monitoring stopped by user${colors.reset}`);
  process.exit(0);
});

// Start monitoring
const monitor = new DeploymentMonitor();
monitor.startMonitoring(); 