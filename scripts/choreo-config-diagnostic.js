#!/usr/bin/env node

/**
 * 🔍 CHOREO CONFIGURATION DIAGNOSTIC TOOL
 * 
 * Analyzes Choreo deployment logs and provides immediate diagnosis
 * for configuration issues, specifically Supabase environment variables.
 * 
 * Usage:
 *   node scripts/choreo-config-diagnostic.js [log-file]
 *   echo "logs" | node scripts/choreo-config-diagnostic.js
 */

const fs = require('fs');
const path = require('path');

class ChoreoConfigDiagnostic {
  constructor() {
    this.issues = [];
    this.recommendations = [];
    this.severity = 'INFO';
  }

  /**
   * Analyze log content for configuration issues
   */
  analyzeLogs(logContent) {
    console.log('🔍 [CHOREO DIAGNOSTIC] Starting configuration analysis...\n');
    
    const lines = logContent.split('\n');
    const analysis = {
      startup: this.analyzeStartup(lines),
      environment: this.analyzeEnvironment(lines),
      supabase: this.analyzeSupabaseConfig(lines),
      errors: this.analyzeErrors(lines),
      performance: this.analyzePerformance(lines)
    };

    this.generateReport(analysis);
    return analysis;
  }

  /**
   * Analyze startup sequence
   */
  analyzeStartup(lines) {
    const startupInfo = {
      serverStart: false,
      standaloneStart: false,
      readyTime: null,
      ports: [],
      issues: []
    };

    lines.forEach(line => {
      if (line.includes('Starting LUMO with static assets')) {
        startupInfo.serverStart = true;
        const portMatch = line.match(/port (\d+)/);
        if (portMatch) startupInfo.ports.push(portMatch[1]);
      }

      if (line.includes('Starting standalone server')) {
        startupInfo.standaloneStart = true;
        const portMatch = line.match(/port (\d+)/);
        if (portMatch) startupInfo.ports.push(portMatch[1]);
      }

      if (line.includes('Ready in')) {
        const timeMatch = line.match(/Ready in (\d+)ms/);
        if (timeMatch) startupInfo.readyTime = parseInt(timeMatch[1]);
      }
    });

    return startupInfo;
  }

  /**
   * Analyze environment detection
   */
  analyzeEnvironment(lines) {
    const envInfo = {
      detections: [],
      issues: [],
      missingConfig: false,
      buildId: false,
      nodeEnv: null
    };

    lines.forEach(line => {
      if (line.includes('Environment Detection:')) {
        const nextLines = this.getNextLines(lines, lines.indexOf(line), 10);
        const envData = this.parseEnvironmentBlock(nextLines);
        envInfo.detections.push(envData);

        if (envData.hasMissingConfig) {
          envInfo.missingConfig = true;
          envInfo.issues.push('Missing configuration detected');
        }

        if (!envData.BUILD_ID) {
          envInfo.buildId = false;
          envInfo.issues.push('BUILD_ID is false - production build issues');
        }

        envInfo.nodeEnv = envData.NODE_ENV;
      }
    });

    return envInfo;
  }

  /**
   * Analyze Supabase configuration
   */
  analyzeSupabaseConfig(lines) {
    const supabaseInfo = {
      hasUrl: false,
      missingConfig: false,
      fallbackClient: false,
      issues: [],
      occurrences: 0
    };

    lines.forEach(line => {
      if (line.includes('hasSupabaseUrl: true')) {
        supabaseInfo.hasUrl = true;
      }

      if (line.includes('Missing Supabase configuration')) {
        supabaseInfo.missingConfig = true;
        supabaseInfo.occurrences++;
      }

      if (line.includes('using fallback client')) {
        supabaseInfo.fallbackClient = true;
      }
    });

    // Determine specific missing components
    if (supabaseInfo.hasUrl && supabaseInfo.missingConfig) {
      supabaseInfo.issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY likely missing');
      supabaseInfo.issues.push('DATABASE_URL likely missing from secrets');
    } else if (supabaseInfo.missingConfig) {
      supabaseInfo.issues.push('NEXT_PUBLIC_SUPABASE_URL missing');
      supabaseInfo.issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY missing');
      supabaseInfo.issues.push('DATABASE_URL missing from secrets');
    }

    return supabaseInfo;
  }

  /**
   * Analyze errors and warnings
   */
  analyzeErrors(lines) {
    const errorInfo = {
      errors: [],
      warnings: [],
      criticalCount: 0,
      warningCount: 0
    };

    lines.forEach(line => {
      if (line.includes('ERROR') || line.includes('Error')) {
        errorInfo.errors.push(line);
        errorInfo.criticalCount++;
      }

      if (line.includes('WARN') || line.includes('warn')) {
        errorInfo.warnings.push(line);
        errorInfo.warningCount++;
      }
    });

    return errorInfo;
  }

  /**
   * Analyze performance metrics
   */
  analyzePerformance(lines) {
    const perfInfo = {
      startupTime: null,
      readyTime: null,
      issues: []
    };

    lines.forEach(line => {
      if (line.includes('Ready in')) {
        const timeMatch = line.match(/Ready in (\d+)ms/);
        if (timeMatch) {
          perfInfo.readyTime = parseInt(timeMatch[1]);
          if (perfInfo.readyTime > 2000) {
            perfInfo.issues.push(`Slow startup: ${perfInfo.readyTime}ms (expected <2000ms)`);
          }
        }
      }
    });

    return perfInfo;
  }

  /**
   * Parse environment detection block
   */
  parseEnvironmentBlock(lines) {
    const envData = {};
    
    lines.forEach(line => {
      if (line.includes('isServer:')) envData.isServer = line.includes('true');
      if (line.includes('isBuild:')) envData.isBuild = line.includes('true');
      if (line.includes('hasMissingConfig:')) envData.hasMissingConfig = line.includes('true');
      if (line.includes('NODE_ENV:')) envData.NODE_ENV = line.match(/'([^']+)'/)?.[1];
      if (line.includes('BUILD_ID:')) envData.BUILD_ID = !line.includes('false');
      if (line.includes('hasSupabaseUrl:')) envData.hasSupabaseUrl = line.includes('true');
    });

    return envData;
  }

  /**
   * Get next N lines from array
   */
  getNextLines(lines, startIndex, count) {
    return lines.slice(startIndex, startIndex + count);
  }

  /**
   * Generate comprehensive diagnostic report
   */
  generateReport(analysis) {
    console.log('🚨 CHOREO CONFIGURATION DIAGNOSTIC REPORT');
    console.log('=' .repeat(60));
    console.log();

    // Critical Issues
    if (analysis.supabase.missingConfig) {
      console.log('❌ CRITICAL ISSUE: Missing Supabase Configuration');
      console.log(`   Detected ${analysis.supabase.occurrences} occurrences of missing config`);
      console.log();
      
      this.severity = 'CRITICAL';
      this.issues.push('Missing Supabase configuration preventing database functionality');
    }

    // Environment Analysis
    console.log('🔧 ENVIRONMENT ANALYSIS:');
    if (analysis.environment.detections.length > 0) {
      const env = analysis.environment.detections[0];
      console.log(`   ✅ Server Mode: ${env.isServer ? 'Active' : 'Inactive'}`);
      console.log(`   ✅ Node Environment: ${env.NODE_ENV || 'Unknown'}`);
      console.log(`   ${env.BUILD_ID ? '✅' : '❌'} Build ID: ${env.BUILD_ID ? 'Present' : 'Missing'}`);
      console.log(`   ${env.hasSupabaseUrl ? '✅' : '❌'} Supabase URL: ${env.hasSupabaseUrl ? 'Present' : 'Missing'}`);
      console.log(`   ${env.hasMissingConfig ? '❌' : '✅'} Configuration: ${env.hasMissingConfig ? 'Incomplete' : 'Complete'}`);
    }
    console.log();

    // Startup Analysis
    console.log('🚀 STARTUP ANALYSIS:');
    console.log(`   ${analysis.startup.serverStart ? '✅' : '❌'} Static Server: ${analysis.startup.serverStart ? 'Started' : 'Failed'}`);
    console.log(`   ${analysis.startup.standaloneStart ? '✅' : '❌'} Standalone Server: ${analysis.startup.standaloneStart ? 'Started' : 'Failed'}`);
    if (analysis.startup.readyTime) {
      console.log(`   ⚡ Ready Time: ${analysis.startup.readyTime}ms ${analysis.startup.readyTime < 1000 ? '(Excellent)' : analysis.startup.readyTime < 2000 ? '(Good)' : '(Slow)'}`);
    }
    if (analysis.startup.ports.length > 0) {
      console.log(`   🌐 Ports: ${analysis.startup.ports.join(', ')}`);
    }
    console.log();

    // Immediate Fix Instructions
    if (analysis.supabase.missingConfig) {
      this.generateFixInstructions(analysis);
    }

    // Performance Summary
    if (analysis.performance.readyTime) {
      console.log('📊 PERFORMANCE:');
      console.log(`   Startup Time: ${analysis.performance.readyTime}ms`);
      if (analysis.performance.issues.length > 0) {
        analysis.performance.issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
      }
      console.log();
    }

    // Error Summary
    if (analysis.errors.criticalCount > 0 || analysis.errors.warningCount > 0) {
      console.log('⚠️  ERROR SUMMARY:');
      console.log(`   Errors: ${analysis.errors.criticalCount}`);
      console.log(`   Warnings: ${analysis.errors.warningCount}`);
      console.log();
    }

    console.log('🔍 DIAGNOSIS COMPLETE');
    console.log('=' .repeat(60));
  }

  /**
   * Generate specific fix instructions
   */
  generateFixInstructions(analysis) {
    console.log('🛠️  IMMEDIATE FIX INSTRUCTIONS:');
    console.log();

    if (analysis.supabase.hasUrl && analysis.supabase.missingConfig) {
      console.log('📋 MISSING ENVIRONMENT VARIABLES:');
      console.log('   The following variables need to be added to Choreo:');
      console.log();
      console.log('   1. NEXT_PUBLIC_SUPABASE_ANON_KEY');
      console.log('      Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8');
      console.log();
      console.log('   2. DATABASE_URL (as secret)');
      console.log('      Value: postgresql://postgres:[password]@db.ndprriqyhddjoixrlqnz.supabase.co:5432/postgres');
      console.log();
    }

    console.log('🎯 CHOREO CONSOLE STEPS:');
    console.log('   1. Go to Choreo Console → Your Project → Environment Variables');
    console.log('   2. Add NEXT_PUBLIC_SUPABASE_ANON_KEY as environment variable');
    console.log('   3. Add DATABASE_URL as secret');
    console.log('   4. Redeploy the application');
    console.log();

    console.log('📄 ALTERNATIVE: Update choreo.yaml');
    console.log('   Add to environment section:');
    console.log('     - name: NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('       value: [anon-key-value]');
    console.log();
    console.log('   Add to secrets section:');
    console.log('     - name: DATABASE_URL');
    console.log('       value: [database-url]');
    console.log();

    console.log('⚡ EXPECTED RESULT:');
    console.log('   - No more "Missing Supabase configuration" messages');
    console.log('   - Database functionality restored');
    console.log('   - Authentication system working');
    console.log('   - Application fully functional');
    console.log();
  }
}

/**
 * Main execution
 */
async function main() {
  const diagnostic = new ChoreoConfigDiagnostic();
  
  try {
    let logContent = '';

    // Check if log file provided as argument
    if (process.argv[2]) {
      const logFile = process.argv[2];
      if (fs.existsSync(logFile)) {
        logContent = fs.readFileSync(logFile, 'utf8');
      } else {
        console.error(`❌ Log file not found: ${logFile}`);
        process.exit(1);
      }
    } else {
      // Read from stdin
      const chunks = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      logContent = Buffer.concat(chunks).toString();
    }

    if (!logContent.trim()) {
      console.log('📝 Usage: node scripts/choreo-config-diagnostic.js [log-file]');
      console.log('   or: echo "logs" | node scripts/choreo-config-diagnostic.js');
      process.exit(1);
    }

    const analysis = diagnostic.analyzeLogs(logContent);
    
    // Save analysis results
    const resultsFile = path.join(__dirname, '..', 'logs', 'choreo-config-analysis.json');
    fs.writeFileSync(resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      severity: diagnostic.severity,
      issues: diagnostic.issues,
      recommendations: diagnostic.recommendations,
      analysis
    }, null, 2));

    console.log(`💾 Analysis saved to: ${resultsFile}`);
    
    // Exit with appropriate code
    process.exit(diagnostic.severity === 'CRITICAL' ? 1 : 0);

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ChoreoConfigDiagnostic; 