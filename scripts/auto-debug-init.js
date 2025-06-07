#!/usr/bin/env node

/**
 * Choreo Automated Debug Log System Initializer
 * 
 * This script initializes the Automated Debug Log System on application startup.
 * It performs initial diagnostics, detects common deployment issues, and applies
 * automatic fixes where possible.
 */

console.log('🔍 Initializing Choreo Automated Debug Log System...');

// Check if running in a Choreo environment
const isChoreoEnvironment = process.env.CHOREO_DEPLOYMENT === 'true' || 
                           process.env.CHOREO_SERVICE_NAME || 
                           process.env.CHOREO_ENVIRONMENT;

// Import required modules
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Configuration
const LOG_DIR = path.join(process.cwd(), 'logs');
const DEBUG_LOG = path.join(LOG_DIR, 'choreo-debug-init.log');
const AUTO_FIX = process.env.CHOREO_AUTO_FIX !== 'false'; // Enable auto-fix by default

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Initialize log file
const timestamp = new Date().toISOString();
fs.writeFileSync(DEBUG_LOG, `[${timestamp}] Choreo Automated Debug Log System Initialization\n`);
fs.appendFileSync(DEBUG_LOG, `Environment: ${process.env.NODE_ENV || 'unknown'}\n`);
fs.appendFileSync(DEBUG_LOG, `Is Choreo: ${isChoreoEnvironment ? 'Yes' : 'No'}\n`);
fs.appendFileSync(DEBUG_LOG, `Auto-fix: ${AUTO_FIX ? 'Enabled' : 'Disabled'}\n`);
fs.appendFileSync(DEBUG_LOG, `Node version: ${process.version}\n`);
fs.appendFileSync(DEBUG_LOG, `Platform: ${process.platform}\n`);
fs.appendFileSync(DEBUG_LOG, `Architecture: ${process.arch}\n\n`);

// Simple logger
const log = (message, level = 'INFO') => {
  const entry = `[${new Date().toISOString()}] [${level}] ${message}\n`;
  fs.appendFileSync(DEBUG_LOG, entry);
  console.log(`[${level}] ${message}`);
};

// Track issues and fixes
const issues = [];
const fixes = [];

/**
 * Check for common deployment issues
 */
function detectIssues() {
  log('Starting issue detection...', 'DETECT');
  
  // Check 1: DATABASE_URL format
  log('Checking DATABASE_URL format...', 'DETECT');
  const databaseUrl = process.env.DATABASE_URL || '';
  
  if (databaseUrl.startsWith('prisma://')) {
    issues.push({
      id: 'db-url-prisma-protocol',
      severity: 'critical',
      description: 'DATABASE_URL uses prisma:// protocol which is not supported in deployment',
      autoFixable: true
    });
    
    log('Issue detected: DATABASE_URL uses prisma:// protocol', 'WARNING');
  } else if (databaseUrl.startsWith('postgres://')) {
    issues.push({
      id: 'db-url-postgres-protocol',
      severity: 'high',
      description: 'DATABASE_URL uses postgres:// protocol which may cause issues with Prisma',
      autoFixable: true
    });
    
    log('Issue detected: DATABASE_URL uses postgres:// protocol', 'WARNING');
  }
  
  // Check 2: Port configuration
  log('Checking port configuration...', 'DETECT');
  const port = process.env.PORT;
  
  if (port && port !== '8080' && process.env.NODE_ENV === 'production') {
    issues.push({
      id: 'incorrect-port',
      severity: 'medium',
      description: 'PORT should be set to 8080 for Choreo deployment',
      autoFixable: true
    });
    
    log(`Issue detected: PORT is set to ${port} instead of 8080`, 'WARNING');
  }
  
  // Check 3: Clerk environment variables
  log('Checking Clerk configuration...', 'DETECT');
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  
  if (!clerkPublishableKey && process.env.NODE_ENV === 'production') {
    issues.push({
      id: 'missing-clerk-publishable-key',
      severity: 'critical',
      description: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set',
      autoFixable: false
    });
    
    log('Issue detected: Missing Clerk publishable key', 'ERROR');
  }
  
  if (!clerkSecretKey && process.env.NODE_ENV === 'production') {
    issues.push({
      id: 'missing-clerk-secret-key',
      severity: 'critical',
      description: 'CLERK_SECRET_KEY is not set',
      autoFixable: false
    });
    
    log('Issue detected: Missing Clerk secret key', 'ERROR');
  }
  
  // Check 4: Prisma binary targets (only for Choreo environment)
  if (isChoreoEnvironment) {
    log('Checking Prisma binary targets...', 'DETECT');
    
    try {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        if (!schemaContent.includes('binaryTargets')) {
          issues.push({
            id: 'missing-prisma-binary-targets',
            severity: 'critical',
            description: 'Missing binaryTargets in schema.prisma',
            autoFixable: true
          });
          
          log('Issue detected: Missing binary targets in schema.prisma', 'ERROR');
        } else if (!schemaContent.includes('debian-openssl-3.0.x')) {
          issues.push({
            id: 'incomplete-prisma-binary-targets',
            severity: 'critical',
            description: 'Missing debian-openssl-3.0.x binary target in schema.prisma',
            autoFixable: true
          });
          
          log('Issue detected: Missing debian-openssl-3.0.x binary target', 'ERROR');
        }
      } else {
        log('schema.prisma not found, skipping binary target check', 'WARNING');
      }
    } catch (error) {
      log(`Error checking schema.prisma: ${error.message}`, 'ERROR');
    }
  }
  
  log(`Issue detection completed. Found ${issues.length} issues.`, 'DETECT');
}

/**
 * Apply automatic fixes for detected issues
 */
function applyFixes() {
  if (!AUTO_FIX) {
    log('Auto-fix is disabled, skipping fixes', 'FIX');
    return;
  }
  
  log(`Starting auto-fix for ${issues.length} issues...`, 'FIX');
  
  // Fix DATABASE_URL format
  const dbUrlPrismaIssue = issues.find(i => i.id === 'db-url-prisma-protocol');
  if (dbUrlPrismaIssue && dbUrlPrismaIssue.autoFixable) {
    log('Fixing DATABASE_URL prisma:// protocol...', 'FIX');
    
    try {
      const databaseUrl = process.env.DATABASE_URL;
      const fixedUrl = databaseUrl.replace('prisma://', 'postgresql://');
      process.env.DATABASE_URL = fixedUrl;
      
      log('Fixed DATABASE_URL: Changed prisma:// to postgresql://', 'FIX');
      fixes.push({
        id: 'db-url-prisma-protocol',
        status: 'success',
        description: 'Changed DATABASE_URL protocol from prisma:// to postgresql://'
      });
    } catch (error) {
      log(`Failed to fix DATABASE_URL: ${error.message}`, 'ERROR');
      fixes.push({
        id: 'db-url-prisma-protocol',
        status: 'failed',
        description: `Failed to fix DATABASE_URL: ${error.message}`
      });
    }
  }
  
  const dbUrlPostgresIssue = issues.find(i => i.id === 'db-url-postgres-protocol');
  if (dbUrlPostgresIssue && dbUrlPostgresIssue.autoFixable) {
    log('Fixing DATABASE_URL postgres:// protocol...', 'FIX');
    
    try {
      const databaseUrl = process.env.DATABASE_URL;
      const fixedUrl = databaseUrl.replace('postgres://', 'postgresql://');
      process.env.DATABASE_URL = fixedUrl;
      
      log('Fixed DATABASE_URL: Changed postgres:// to postgresql://', 'FIX');
      fixes.push({
        id: 'db-url-postgres-protocol',
        status: 'success',
        description: 'Changed DATABASE_URL protocol from postgres:// to postgresql://'
      });
    } catch (error) {
      log(`Failed to fix DATABASE_URL: ${error.message}`, 'ERROR');
      fixes.push({
        id: 'db-url-postgres-protocol',
        status: 'failed',
        description: `Failed to fix DATABASE_URL: ${error.message}`
      });
    }
  }
  
  // Fix PORT configuration
  const portIssue = issues.find(i => i.id === 'incorrect-port');
  if (portIssue && portIssue.autoFixable) {
    log('Fixing PORT configuration...', 'FIX');
    
    try {
      process.env.PORT = '8080';
      
      log('Fixed PORT: Set to 8080', 'FIX');
      fixes.push({
        id: 'incorrect-port',
        status: 'success',
        description: 'Set PORT environment variable to 8080'
      });
    } catch (error) {
      log(`Failed to fix PORT: ${error.message}`, 'ERROR');
      fixes.push({
        id: 'incorrect-port',
        status: 'failed',
        description: `Failed to fix PORT: ${error.message}`
      });
    }
  }
  
  // Fix Prisma binary targets (requires schema update and regeneration)
  const binaryTargetsIssue = issues.find(i => 
    i.id === 'missing-prisma-binary-targets' || i.id === 'incomplete-prisma-binary-targets'
  );
  
  if (binaryTargetsIssue && binaryTargetsIssue.autoFixable) {
    log('Fixing Prisma binary targets...', 'FIX');
    
    try {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      let schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      if (!schemaContent.includes('binaryTargets')) {
        // Add binary targets to generator
        schemaContent = schemaContent.replace(
          /generator\s+client\s+{[^}]*}/s,
          match => match.includes('}') 
            ? match.replace('}', '  binaryTargets = ["native", "debian-openssl-3.0.x"]\n}')
            : match
        );
      } else if (!schemaContent.includes('debian-openssl-3.0.x')) {
        // Add missing target
        schemaContent = schemaContent.replace(
          /binaryTargets\s*=\s*\[\s*"([^"]+)"\s*\]/,
          'binaryTargets = ["$1", "debian-openssl-3.0.x"]'
        );
      }
      
      // Write updated schema
      fs.writeFileSync(schemaPath, schemaContent);
      log('Updated schema.prisma with correct binary targets', 'FIX');
      
      // Run prisma generate
      log('Running prisma generate to apply binary target changes...', 'FIX');
      const generateResult = spawnSync('npx', ['prisma', 'generate'], { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      if (generateResult.status === 0) {
        log('Prisma client regenerated successfully with updated binary targets', 'FIX');
        fixes.push({
          id: binaryTargetsIssue.id,
          status: 'success',
          description: 'Updated schema.prisma with debian-openssl-3.0.x binary target and regenerated client'
        });
      } else {
        log(`Failed to regenerate Prisma client: ${generateResult.stderr}`, 'ERROR');
        fixes.push({
          id: binaryTargetsIssue.id,
          status: 'partial',
          description: 'Updated schema.prisma but failed to regenerate client'
        });
      }
    } catch (error) {
      log(`Failed to fix Prisma binary targets: ${error.message}`, 'ERROR');
      fixes.push({
        id: binaryTargetsIssue.id,
        status: 'failed',
        description: `Failed to fix Prisma binary targets: ${error.message}`
      });
    }
  }
  
  log(`Auto-fix completed. Applied ${fixes.filter(f => f.status === 'success').length} fixes successfully.`, 'FIX');
}

/**
 * Generate a summary of issues and fixes
 */
function generateSummary() {
  log('\nGenerating diagnostics summary...', 'SUMMARY');
  
  const summary = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    isChoreo: isChoreoEnvironment,
    autoFix: AUTO_FIX,
    issues: {
      total: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length
    },
    fixes: {
      total: fixes.length,
      successful: fixes.filter(f => f.status === 'success').length,
      partial: fixes.filter(f => f.status === 'partial').length,
      failed: fixes.filter(f => f.status === 'failed').length
    },
    details: {
      issues,
      fixes
    }
  };
  
  // Write summary to file
  const summaryPath = path.join(LOG_DIR, 'choreo-debug-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  log(`Summary written to ${summaryPath}`, 'SUMMARY');
  
  // Log summary to console
  console.log('\n=== Choreo Automated Debug Summary ===');
  console.log(`Environment: ${summary.environment} (Choreo: ${summary.isChoreo ? 'Yes' : 'No'})`);
  console.log(`Issues detected: ${summary.issues.total} (Critical: ${summary.issues.critical}, High: ${summary.issues.high})`);
  console.log(`Fixes applied: ${summary.fixes.successful}/${summary.fixes.total}`);
  
  if (summary.issues.critical > 0 || summary.issues.high > 0) {
    console.log('\n⚠️ Critical or high severity issues detected!');
    console.log('Review the logs and address these issues for optimal deployment.');
    
    // List critical and high issues
    issues.filter(i => i.severity === 'critical' || i.severity === 'high')
      .forEach(issue => {
        const fix = fixes.find(f => f.id === issue.id);
        const status = fix ? `[${fix.status.toUpperCase()}]` : '[NOT FIXED]';
        console.log(`- ${issue.severity.toUpperCase()}: ${issue.description} ${status}`);
      });
  } else if (summary.issues.total > 0) {
    console.log('\n✓ No critical issues detected, but some minor issues were found.');
    console.log('Check the logs for details and potential improvements.');
  } else {
    console.log('\n✓ No issues detected! The deployment is healthy.');
  }
  
  return summary;
}

// Main execution
try {
  // Run issue detection
  detectIssues();
  
  // Apply fixes
  applyFixes();
  
  // Generate summary
  const summary = generateSummary();
  
  // Exit with appropriate code
  if (summary.issues.critical > 0 && summary.fixes.successful < summary.issues.critical) {
    log('Initialization completed with unfixed critical issues', 'EXIT');
    process.exit(1);
  } else {
    log('Initialization completed successfully', 'EXIT');
    process.exit(0);
  }
} catch (error) {
  log(`Unexpected error in Automated Debug Log System: ${error.message}`, 'ERROR');
  log(error.stack, 'ERROR');
  process.exit(1);
} 