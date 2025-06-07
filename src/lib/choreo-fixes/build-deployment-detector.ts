/**
 * Build and Deployment Issue Detector for Choreo
 * 
 * Detects common build and deployment issues that occur in Choreo environments:
 * - Build script problems
 * - Dependency issues
 * - Docker configuration problems
 * - Memory and resource constraints
 * - File system permissions
 */

import fs from 'fs';
import path from 'path';

export interface BuildIssue {
  id: string;
  category: 'build-script' | 'dependencies' | 'docker' | 'resources' | 'filesystem';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  autoFixable: boolean;
  metadata?: Record<string, any>;
  recommendations?: string[];
}

export interface BuildFix {
  issueId: string;
  status: 'success' | 'failed' | 'partial';
  description: string;
  appliedAt: string;
  details?: string;
}

/**
 * Detect build and deployment issues
 */
export async function detectBuildIssues(): Promise<BuildIssue[]> {
  const issues: BuildIssue[] = [];
  
  // Check 1: Package.json configuration
  await checkPackageJsonIssues(issues);
  
  // Check 2: Docker configuration
  await checkDockerConfiguration(issues);
  
  // Check 3: Build script issues
  await checkBuildScripts(issues);
  
  // Check 4: Dependency issues
  await checkDependencyIssues(issues);
  
  // Check 5: File system and permissions
  await checkFileSystemIssues(issues);
  
  // Check 6: Memory and resource configuration
  await checkResourceConfiguration(issues);
  
  return issues;
}

/**
 * Check package.json for common issues
 */
async function checkPackageJsonIssues(issues: BuildIssue[]): Promise<void> {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    issues.push({
      id: 'missing-package-json',
      category: 'build-script',
      severity: 'critical',
      title: 'Missing package.json',
      description: 'package.json file is required for Node.js applications',
      autoFixable: false
    });
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check for required scripts
    const requiredScripts = ['build', 'start'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);
    
    if (missingScripts.length > 0) {
      issues.push({
        id: 'missing-build-scripts',
        category: 'build-script',
        severity: 'high',
        title: 'Missing Required Build Scripts',
        description: `Missing required scripts: ${missingScripts.join(', ')}`,
        autoFixable: true,
        metadata: {
          missingScripts,
          currentScripts: Object.keys(packageJson.scripts || {})
        },
        recommendations: [
          'Add a "build" script for production builds',
          'Add a "start" script for running the application',
          'Consider adding "dev" script for development'
        ]
      });
    }
    
    // Check for Next.js specific issues
    if (packageJson.dependencies?.['next']) {
      if (!packageJson.scripts?.build?.includes('next build')) {
        issues.push({
          id: 'incorrect-nextjs-build-script',
          category: 'build-script',
          severity: 'medium',
          title: 'Incorrect Next.js Build Script',
          description: 'Build script should use "next build" for Next.js applications',
          autoFixable: true,
          metadata: {
            currentBuildScript: packageJson.scripts?.build,
            expectedBuildScript: 'next build'
          }
        });
      }
    }
    
    // Check Node.js version specification
    if (!packageJson.engines?.node) {
      issues.push({
        id: 'missing-node-version',
        category: 'dependencies',
        severity: 'medium',
        title: 'Missing Node.js Version Specification',
        description: 'No Node.js version specified in package.json engines field',
        autoFixable: true,
        metadata: {
          currentNodeVersion: process.version
        },
        recommendations: [
          'Add "engines" field to package.json',
          `Specify Node.js version: "node": "${process.version}"`
        ]
      });
    }
    
  } catch (error) {
    issues.push({
      id: 'invalid-package-json',
      category: 'build-script',
      severity: 'critical',
      title: 'Invalid package.json',
      description: 'package.json file contains invalid JSON',
      autoFixable: false,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

/**
 * Check Docker configuration
 */
async function checkDockerConfiguration(issues: BuildIssue[]): Promise<void> {
  const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
  
  if (!fs.existsSync(dockerfilePath)) {
    issues.push({
      id: 'missing-dockerfile',
      category: 'docker',
      severity: 'high',
      title: 'Missing Dockerfile',
      description: 'Dockerfile is required for Choreo deployment',
      autoFixable: true,
      recommendations: [
        'Create a Dockerfile for containerized deployment',
        'Use Node.js official image as base',
        'Set proper working directory and copy files',
        'Expose port 8080 for Choreo'
      ]
    });
    return;
  }
  
  try {
    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
    
    // Check for port exposure
    if (!dockerfileContent.includes('EXPOSE')) {
      issues.push({
        id: 'missing-docker-port-expose',
        category: 'docker',
        severity: 'high',
        title: 'Missing Port Exposure',
        description: 'Dockerfile should expose port 8080 for Choreo',
        autoFixable: true,
        metadata: {
          recommendation: 'Add EXPOSE 8080 to Dockerfile'
        }
      });
    } else if (!dockerfileContent.includes('EXPOSE 8080')) {
      issues.push({
        id: 'incorrect-docker-port',
        category: 'docker',
        severity: 'medium',
        title: 'Incorrect Port Exposure',
        description: 'Dockerfile should expose port 8080, not 3000',
        autoFixable: true,
        metadata: {
          currentPort: dockerfileContent.match(/EXPOSE\s+(\d+)/)?.[1] || 'unknown',
          expectedPort: '8080'
        }
      });
    }
    
  } catch (error) {
    issues.push({
      id: 'docker-read-error',
      category: 'docker',
      severity: 'medium',
      title: 'Cannot Read Dockerfile',
      description: 'Error reading Dockerfile content',
      autoFixable: false,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

/**
 * Check build scripts for issues
 */
async function checkBuildScripts(issues: BuildIssue[]): Promise<void> {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) return;
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const buildScript = packageJson.scripts?.build;
    
    if (buildScript) {
      // Check for Prisma generate in build script
      if (packageJson.dependencies?.['@prisma/client'] && !buildScript.includes('prisma generate')) {
        issues.push({
          id: 'missing-prisma-generate-in-build',
          category: 'build-script',
          severity: 'high',
          title: 'Missing Prisma Generate in Build Script',
          description: 'Build script should include "prisma generate" when using Prisma',
          autoFixable: true,
          metadata: {
            currentBuildScript: buildScript,
            suggestedBuildScript: 'prisma generate && next build'
          }
        });
      }
    }
    
  } catch (error) {
    // Already handled in checkPackageJsonIssues
  }
}

/**
 * Check for dependency issues
 */
async function checkDependencyIssues(issues: BuildIssue[]): Promise<void> {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  const packageLockPath = path.join(process.cwd(), 'package-lock.json');
  
  // Check if node_modules exists
  if (!fs.existsSync(nodeModulesPath)) {
    issues.push({
      id: 'missing-node-modules',
      category: 'dependencies',
      severity: 'critical',
      title: 'Missing node_modules',
      description: 'Dependencies are not installed',
      autoFixable: true,
      recommendations: ['Run npm install to install dependencies']
    });
  }
  
  // Check for package-lock.json
  if (!fs.existsSync(packageLockPath)) {
    issues.push({
      id: 'missing-package-lock',
      category: 'dependencies',
      severity: 'medium',
      title: 'Missing package-lock.json',
      description: 'package-lock.json ensures consistent dependency versions',
      autoFixable: true,
      recommendations: ['Run npm install to generate package-lock.json']
    });
  }
}

/**
 * Check file system issues
 */
async function checkFileSystemIssues(issues: BuildIssue[]): Promise<void> {
  // Check write permissions for common directories
  const criticalDirs = [
    'logs',
    'uploads',
    'temp',
    '.next'
  ];
  
  for (const dir of criticalDirs) {
    const dirPath = path.join(process.cwd(), dir);
    
    try {
      // Try to create directory if it doesn't exist
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Test write permissions
      const testFile = path.join(dirPath, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
    } catch (error) {
      issues.push({
        id: `filesystem-permission-${dir}`,
        category: 'filesystem',
        severity: dir === 'logs' ? 'high' : 'medium',
        title: `File System Permission Issue: ${dir}`,
        description: `Cannot write to ${dir} directory`,
        autoFixable: false,
        metadata: {
          directory: dir,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        recommendations: [
          `Ensure write permissions for ${dir} directory`,
          'Check Docker user permissions if running in container'
        ]
      });
    }
  }
}

/**
 * Check resource configuration
 */
async function checkResourceConfiguration(issues: BuildIssue[]): Promise<void> {
  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemoryMB = memoryUsage.heapTotal / 1024 / 1024;
  
  if (totalMemoryMB > 1024) { // More than 1GB heap
    issues.push({
      id: 'high-memory-usage',
      category: 'resources',
      severity: 'medium',
      title: 'High Memory Usage',
      description: 'Application is using more than 1GB of memory',
      autoFixable: false,
      metadata: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(totalMemoryMB),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      recommendations: [
        'Monitor memory usage during build',
        'Consider optimizing dependencies',
        'Check for memory leaks',
        'Increase Choreo resource limits if needed'
      ]
    });
  }
}

/**
 * Apply automatic fixes for build issues
 */
export async function applyBuildFixes(issues: BuildIssue[]): Promise<BuildFix[]> {
  const fixes: BuildFix[] = [];
  
  for (const issue of issues) {
    if (!issue.autoFixable) continue;
    
    try {
      let fixed = false;
      let details = '';
      
      switch (issue.id) {
        case 'missing-build-scripts':
          fixed = await fixMissingBuildScripts(issue);
          details = 'Added missing build and start scripts to package.json';
          break;
          
        case 'missing-prisma-generate-in-build':
          fixed = await fixPrismaGenerateInBuild(issue);
          details = 'Added "prisma generate" to build script';
          break;
          
        case 'missing-node-version':
          fixed = await fixMissingNodeVersion(issue);
          details = 'Added Node.js version to package.json engines';
          break;
          
        default:
          fixed = false;
          details = 'No automatic fix available for this issue';
      }
      
      fixes.push({
        issueId: issue.id,
        status: fixed ? 'success' : 'failed',
        description: details || (fixed ? 'Fix applied successfully' : 'Failed to apply fix'),
        appliedAt: new Date().toISOString(),
        details
      });
      
    } catch (error) {
      fixes.push({
        issueId: issue.id,
        status: 'failed',
        description: 'Error applying fix',
        appliedAt: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return fixes;
}

// Helper functions for applying fixes

async function fixMissingBuildScripts(issue: BuildIssue): Promise<boolean> {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    const missingScripts = issue.metadata?.missingScripts || [];
    
    if (missingScripts.includes('build')) {
      packageJson.scripts.build = packageJson.dependencies?.['next'] ? 'next build' : 'echo "Add your build command here"';
    }
    
    if (missingScripts.includes('start')) {
      packageJson.scripts.start = packageJson.dependencies?.['next'] ? 'next start' : 'node server.js';
    }
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    return true;
  } catch (error) {
    return false;
  }
}

async function fixPrismaGenerateInBuild(issue: BuildIssue): Promise<boolean> {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.scripts?.build) {
      packageJson.scripts.build = `prisma generate && ${packageJson.scripts.build}`;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

async function fixMissingNodeVersion(issue: BuildIssue): Promise<boolean> {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.engines) {
      packageJson.engines = {};
    }
    
    packageJson.engines.node = process.version;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Export for integration with main debug system
 */
export const buildDeploymentDetector = {
  detectIssues: detectBuildIssues,
  applyFixes: applyBuildFixes
}; 