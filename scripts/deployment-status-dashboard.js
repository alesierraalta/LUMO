#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const CHOREO_URL = 'https://lumo-1615540597-7595685744.choreoapis.dev';
const REFRESH_INTERVAL = 5000; // 5 seconds
const LOG_FILE = path.join(__dirname, '../logs/deployment-status.log');

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

class DeploymentDashboard {
  constructor() {
    this.startTime = Date.now();
    this.status = {
      health: { status: 'unknown', lastCheck: null, responseTime: null, error: null },
      database: { status: 'unknown', lastCheck: null, responseTime: null, error: null },
      enhancedLogin: { status: 'unknown', lastCheck: null, responseTime: null, error: null, clientStatus: null },
      auth: { status: 'unknown', lastCheck: null, responseTime: null, error: null },
      p6001Fix: { status: 'unknown', lastCheck: null, active: false, fallbackActive: false }
    };
    this.deploymentPhase = 'Unknown';
    this.consecutiveSuccesses = 0;
    this.totalChecks = 0;
    this.deploymentComplete = false;
  }

  log(message, writeToFile = true) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    if (writeToFile) {
      try {
        fs.appendFileSync(LOG_FILE, logMessage + '\n');
      } catch (error) {
        // Ignore file write errors
      }
    }
  }

  clearScreen() {
    process.stdout.write('\x1b[2J\x1b[0f');
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getStatusIcon(status) {
    switch (status) {
      case 'ok': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'unknown': return '❓';
      case 'checking': return '🔄';
      default: return '❓';
    }
  }

  getStatusColor(status) {
    switch (status) {
      case 'ok': return 'green';
      case 'error': return 'red';
      case 'warning': return 'yellow';
      case 'unknown': return 'gray';
      case 'checking': return 'cyan';
      default: return 'gray';
    }
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve) => {
      const requestOptions = {
        timeout: 8000,
        headers: {
          'User-Agent': 'LUMO-Dashboard/1.0',
          'Accept': 'application/json',
          ...options.headers
        }
      };

      const req = https.request(url, requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            success: true,
            status: res.statusCode,
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

  async checkHealth() {
    this.status.health.status = 'checking';
    const result = await this.makeRequest(`${CHOREO_URL}/api/health`);
    
    this.status.health.lastCheck = new Date();
    this.status.health.responseTime = result.responseTime;
    
    if (result.success && result.status === 200) {
      this.status.health.status = 'ok';
      this.status.health.error = null;
    } else {
      this.status.health.status = 'error';
      this.status.health.error = result.error || `HTTP ${result.status}`;
    }
  }

  async checkDatabase() {
    this.status.database.status = 'checking';
    const result = await this.makeRequest(`${CHOREO_URL}/api/health-advanced`);
    
    this.status.database.lastCheck = new Date();
    this.status.database.responseTime = result.responseTime;
    
    if (result.success && result.status === 200) {
      this.status.database.status = 'ok';
      this.status.database.error = null;
    } else {
      this.status.database.status = 'error';
      this.status.database.error = result.error || `HTTP ${result.status}`;
    }
  }

  async checkEnhancedLogin() {
    this.status.enhancedLogin.status = 'checking';
    const result = await this.makeRequest(`${CHOREO_URL}/api/auth/enhanced-login`);
    
    this.status.enhancedLogin.lastCheck = new Date();
    this.status.enhancedLogin.responseTime = result.responseTime;
    
    if (result.success && result.status === 200) {
      this.status.enhancedLogin.status = 'ok';
      this.status.enhancedLogin.error = null;
      
      try {
        const data = JSON.parse(result.data);
        this.status.enhancedLogin.clientStatus = data.clientStatus;
        
        // Update P6001 fix status
        if (data.clientStatus) {
          this.status.p6001Fix.active = true;
          this.status.p6001Fix.fallbackActive = data.clientStatus.fallbackActive || false;
          this.status.p6001Fix.status = data.clientStatus.fallbackActive ? 'warning' : 'ok';
        }
      } catch (parseError) {
        this.status.enhancedLogin.clientStatus = null;
      }
    } else {
      this.status.enhancedLogin.status = 'error';
      this.status.enhancedLogin.error = result.error || `HTTP ${result.status}`;
    }
  }

  async checkAuth() {
    this.status.auth.status = 'checking';
    const result = await this.makeRequest(`${CHOREO_URL}/api/auth/enhanced-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrong-password'
      })
    });
    
    this.status.auth.lastCheck = new Date();
    this.status.auth.responseTime = result.responseTime;
    
    if (result.success && result.status === 401) {
      this.status.auth.status = 'ok';
      this.status.auth.error = null;
    } else if (result.success) {
      this.status.auth.status = 'warning';
      this.status.auth.error = `Unexpected status: ${result.status}`;
    } else {
      this.status.auth.status = 'error';
      this.status.auth.error = result.error || `HTTP ${result.status}`;
    }
  }

  determineDeploymentPhase() {
    const allErrors = Object.values(this.status).every(s => s.status === 'error');
    const allOk = Object.values(this.status).every(s => s.status === 'ok');
    const someOk = Object.values(this.status).some(s => s.status === 'ok');
    
    if (allOk) {
      this.deploymentPhase = 'Complete ✅';
      this.deploymentComplete = true;
    } else if (someOk) {
      this.deploymentPhase = 'Starting Services 🚀';
    } else if (allErrors) {
      const hasConnectionErrors = Object.values(this.status).some(s => 
        s.error && (s.error.includes('ECONNRESET') || s.error.includes('ECONNREFUSED'))
      );
      
      if (hasConnectionErrors) {
        this.deploymentPhase = 'Building/Deploying 🔨';
      } else {
        this.deploymentPhase = 'Error State ❌';
      }
    } else {
      this.deploymentPhase = 'Mixed State ⚠️';
    }
  }

  renderHeader() {
    const elapsed = this.formatDuration(Date.now() - this.startTime);
    const title = `${colors.bold}${colors.cyan}🚀 LUMO Deployment Dashboard${colors.reset}`;
    const subtitle = `${colors.gray}Real-time deployment monitoring and P6001 fix status${colors.reset}`;
    
    console.log('═'.repeat(80));
    console.log(title.padStart(50));
    console.log(subtitle.padStart(55));
    console.log('═'.repeat(80));
    console.log(`${colors.blue}📍 Target:${colors.reset} ${CHOREO_URL}`);
    console.log(`${colors.blue}⏱️ Elapsed:${colors.reset} ${elapsed} | ${colors.blue}🔄 Checks:${colors.reset} ${this.totalChecks} | ${colors.blue}📊 Phase:${colors.reset} ${this.deploymentPhase}`);
    console.log('─'.repeat(80));
  }

  renderServiceStatus() {
    console.log(`${colors.bold}${colors.white}🔧 Service Status${colors.reset}`);
    console.log('─'.repeat(40));
    
    const services = [
      { name: 'Health Check', key: 'health', description: 'Basic API health' },
      { name: 'Database', key: 'database', description: 'Database connectivity' },
      { name: 'Enhanced Login', key: 'enhancedLogin', description: 'P6001-resistant auth' },
      { name: 'Authentication', key: 'auth', description: 'Auth endpoint test' }
    ];
    
    services.forEach(service => {
      const status = this.status[service.key];
      const icon = this.getStatusIcon(status.status);
      const color = this.getStatusColor(status.status);
      const responseTime = status.responseTime ? `${status.responseTime}ms` : 'N/A';
      const lastCheck = status.lastCheck ? status.lastCheck.toLocaleTimeString() : 'Never';
      
      console.log(`${icon} ${colors[color]}${service.name.padEnd(15)}${colors.reset} | ${responseTime.padEnd(8)} | ${lastCheck}`);
      
      if (status.error) {
        console.log(`   ${colors.red}└─ Error: ${status.error}${colors.reset}`);
      }
    });
  }

  renderP6001Status() {
    console.log(`\n${colors.bold}${colors.magenta}🛡️ P6001 Fix Status${colors.reset}`);
    console.log('─'.repeat(40));
    
    const p6001Status = this.status.p6001Fix;
    const clientStatus = this.status.enhancedLogin.clientStatus;
    
    if (p6001Status.active) {
      const icon = p6001Status.fallbackActive ? '⚠️' : '✅';
      const statusText = p6001Status.fallbackActive ? 'Fallback Active' : 'Standard Client';
      const color = p6001Status.fallbackActive ? 'yellow' : 'green';
      
      console.log(`${icon} ${colors[color]}Status: ${statusText}${colors.reset}`);
      
      if (clientStatus) {
                 console.log(`📊 Connected: ${clientStatus.connected ? '✅ Yes' : '❌ No'}`);
         console.log(`🔄 Client Type: ${clientStatus.clientType || 'Unknown'}`);
        
        if (clientStatus.lastP6001Error) {
          const errorTime = new Date(clientStatus.lastP6001Error).toLocaleString();
          console.log(`⚠️ Last P6001 Error: ${errorTime}`);
        }
      }
    } else {
      console.log(`❓ ${colors.gray}P6001 fix status unknown${colors.reset}`);
    }
  }

  renderDeploymentProgress() {
    console.log(`\n${colors.bold}${colors.blue}📈 Deployment Progress${colors.reset}`);
    console.log('─'.repeat(40));
    
    const successRate = this.totalChecks > 0 ? 
      Math.round((this.consecutiveSuccesses / this.totalChecks) * 100) : 0;
    
    console.log(`🎯 Success Rate: ${successRate}%`);
    console.log(`🔄 Consecutive Successes: ${this.consecutiveSuccesses}`);
    console.log(`📊 Total Checks: ${this.totalChecks}`);
    
    if (this.deploymentComplete) {
      console.log(`\n${colors.green}${colors.bold}🎉 DEPLOYMENT COMPLETE! 🎉${colors.reset}`);
      console.log(`${colors.green}✅ All services are operational${colors.reset}`);
      console.log(`${colors.green}✅ P6001 fix is working correctly${colors.reset}`);
    }
  }

  renderFooter() {
    console.log('\n' + '─'.repeat(80));
    console.log(`${colors.gray}Last updated: ${new Date().toLocaleTimeString()} | Press Ctrl+C to exit${colors.reset}`);
    console.log('═'.repeat(80));
  }

  async performChecks() {
    this.totalChecks++;
    
    // Run all checks in parallel
    await Promise.all([
      this.checkHealth(),
      this.checkDatabase(),
      this.checkEnhancedLogin(),
      this.checkAuth()
    ]);
    
    // Determine deployment phase
    this.determineDeploymentPhase();
    
    // Update consecutive successes
    const allOk = Object.values(this.status).every(s => s.status === 'ok');
    if (allOk) {
      this.consecutiveSuccesses++;
    } else {
      this.consecutiveSuccesses = 0;
    }
    
    // Log status
    const statusSummary = Object.entries(this.status)
      .map(([key, status]) => `${key}:${status.status}`)
      .join(', ');
    
    this.log(`Check #${this.totalChecks} - ${statusSummary} - Phase: ${this.deploymentPhase}`);
  }

  render() {
    this.clearScreen();
    this.renderHeader();
    this.renderServiceStatus();
    this.renderP6001Status();
    this.renderDeploymentProgress();
    this.renderFooter();
  }

  async start() {
    console.log(`${colors.cyan}🚀 Starting LUMO Deployment Dashboard...${colors.reset}\n`);
    
    // Initial check
    await this.performChecks();
    this.render();
    
    // Set up interval
    const interval = setInterval(async () => {
      await this.performChecks();
      this.render();
      
      // Auto-exit if deployment is complete for 3 consecutive checks
      if (this.deploymentComplete && this.consecutiveSuccesses >= 3) {
        clearInterval(interval);
        console.log(`\n${colors.green}🏁 Deployment monitoring complete! Exiting...${colors.reset}`);
        process.exit(0);
      }
    }, REFRESH_INTERVAL);
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log(`\n${colors.yellow}📡 Dashboard stopped by user${colors.reset}`);
      process.exit(0);
    });
  }
}

// Start the dashboard
const dashboard = new DeploymentDashboard();
dashboard.start(); 