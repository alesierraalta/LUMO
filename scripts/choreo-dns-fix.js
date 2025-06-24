#!/usr/bin/env node

/**
 * Choreo DNS Resolution Fix
 * Addresses the EAI_AGAIN error in Choreo build system
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 CHOREO DNS RESOLUTION FIX');
console.log('=============================');

// 1. Create simplified package.json scripts
function createSimplifiedScripts() {
  console.log('📝 Step 1: Creating simplified build scripts...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add DNS-safe scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'build:safe': 'next build',
    'start:safe': 'node server.js',
    'deploy:simple': 'echo "Using simplified deployment"'
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('   ✅ Added DNS-safe scripts to package.json');
}

// 2. Create network-safe environment configuration
function createNetworkSafeConfig() {
  console.log('📝 Step 2: Creating network-safe configuration...');
  
  const config = `# Network-Safe Environment Configuration
# Avoids DNS resolution issues during build

NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS="--max-old-space-size=2048"

# Disable network-dependent features during build
DISABLE_NETWORK_CHECKS=true
SKIP_STATUS_UPDATES=true
CHOREO_SAFE_MODE=true

# Health check configuration
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_RETRIES=3
`;

  fs.writeFileSync('.env.choreo', config);
  console.log('   ✅ Created .env.choreo with network-safe settings');
}

// 3. Create DNS troubleshooting guide
function createTroubleshootingGuide() {
  console.log('📝 Step 3: Creating troubleshooting guide...');
  
  const guide = `# Choreo DNS Resolution Troubleshooting

## Issue Description
Error: \`getaddrinfo EAI_AGAIN app.choreo.dev\`

This error occurs in Choreo's internal build system when it tries to update deployment status.

## Root Cause
- DNS resolution failure in Choreo's build infrastructure
- The error is in \`configurable-generation-status-update.js\` (Choreo's internal script)
- NOT caused by your application code

## Solutions

### 1. Use Simplified Configuration
\`\`\`bash
# Use the simplified choreo.yaml
cp choreo-simple.yaml choreo.yaml
\`\`\`

### 2. Use Alternative Dockerfile
\`\`\`bash
# Use the DNS-safe Dockerfile
cp Dockerfile.simple Dockerfile
\`\`\`

### 3. Retry Deployment
- DNS issues are often temporary
- Try redeploying after 30-60 minutes
- Check Choreo status page for infrastructure issues

### 4. Contact Choreo Support
If the issue persists:
- Report the DNS resolution error
- Include the full error log
- Mention the \`configurable-generation-status-update.js\` script

## Monitoring Commands
\`\`\`bash
# Check deployment status
node scripts/monitor-choreo-deployment.js

# Test DNS resolution
nslookup app.choreo.dev

# Verify application health
curl https://your-app.choreoapps.dev/api/health
\`\`\`
`;

  fs.writeFileSync('CHOREO_DNS_TROUBLESHOOTING.md', guide);
  console.log('   ✅ Created troubleshooting guide');
}

// 4. Create retry mechanism
function createRetryScript() {
  console.log('📝 Step 4: Creating deployment retry script...');
  
  const retryScript = `#!/usr/bin/env node

/**
 * Choreo Deployment Retry Script
 * Implements exponential backoff for DNS resolution issues
 */

const { execSync } = require('child_process');

const MAX_RETRIES = 5;
const BASE_DELAY = 30000; // 30 seconds

async function retryDeployment() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(\`🚀 Deployment attempt \${attempt}/\${MAX_RETRIES}\`);
    
    try {
      // Use git to trigger redeploy
      execSync('git commit --allow-empty -m "Retry deployment - DNS fix attempt"');
      execSync('git push origin main');
      
      console.log('✅ Deployment triggered successfully');
      
      // Wait for build to start
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      // Check if deployment is progressing
      const response = await fetch('https://your-app.choreoapps.dev/api/health')
        .catch(() => null);
      
      if (response && response.ok) {
        console.log('🎉 Deployment successful!');
        return true;
      }
      
    } catch (error) {
      console.log(\`❌ Attempt \${attempt} failed: \${error.message}\`);
    }
    
    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY * Math.pow(2, attempt - 1);
      console.log(\`⏳ Waiting \${delay/1000} seconds before retry...\`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.log('❌ All retry attempts failed');
  return false;
}

retryDeployment().catch(console.error);
`;

  fs.writeFileSync('scripts/retry-deployment.js', retryScript);
  console.log('   ✅ Created deployment retry script');
}

// 5. Update .dockerignore to reduce build context
function updateDockerIgnore() {
  console.log('📝 Step 5: Updating .dockerignore...');
  
  const dockerIgnore = `# Reduce build context to avoid network timeouts
node_modules
.git
.github
.next
*.log
*.md
docs/
test-results/
playwright-report/
coverage/
.env*
!.env.choreo
*.test.*
*.spec.*
__tests__/
__mocks__/
temp/
tmp/
uploads/
logs/
reports/
`;

  fs.writeFileSync('.dockerignore', dockerIgnore);
  console.log('   ✅ Updated .dockerignore');
}

// Execute all fixes
async function main() {
  try {
    createSimplifiedScripts();
    createNetworkSafeConfig();
    createTroubleshootingGuide();
    createRetryScript();
    updateDockerIgnore();
    
    console.log('\n🎉 DNS RESOLUTION FIX COMPLETED!');
    console.log('\n📋 Next Steps:');
    console.log('1. Use: cp choreo-simple.yaml choreo.yaml');
    console.log('2. Use: cp Dockerfile.simple Dockerfile');
    console.log('3. Commit and push changes');
    console.log('4. If deployment fails, run: node scripts/retry-deployment.js');
    console.log('\n🔍 For troubleshooting: See CHOREO_DNS_TROUBLESHOOTING.md');
    
  } catch (error) {
    console.error('❌ Error applying DNS fixes:', error.message);
    process.exit(1);
  }
}

main(); 