#!/usr/bin/env node

/**
 * Commit and Push Script for Choreo Deployment
 * Handles git operations with proper error handling
 */

const { execSync } = require('child_process')

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`)
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' })
    console.log(`✅ ${description} completed`)
    if (output.trim()) {
      console.log(`   Output: ${output.trim()}`)
    }
    return true
  } catch (error) {
    console.error(`❌ ${description} failed:`)
    console.error(`   Error: ${error.message}`)
    if (error.stdout) {
      console.error(`   Stdout: ${error.stdout}`)
    }
    if (error.stderr) {
      console.error(`   Stderr: ${error.stderr}`)
    }
    return false
  }
}

async function main() {
  console.log('🚀 [Commit & Push] Starting git operations for Choreo deployment...')
  console.log('=' * 60)
  
  // Check git status
  if (!runCommand('git status --porcelain', 'Checking git status')) {
    process.exit(1)
  }
  
  // Add all changes
  if (!runCommand('git add .', 'Adding all changes')) {
    process.exit(1)
  }
  
  // Commit with deployment message
  const timestamp = new Date().toISOString()
  const commitMessage = `🚀 Fix 404 issues - Custom server & enhanced routing

- Created custom server.js with proper Next.js handling
- Added /api/debug-choreo endpoint for Choreo debugging
- Enhanced middleware with additional public routes
- Updated choreo.yaml to use custom server
- Fixed package.json start command
- Added comprehensive endpoint testing script

Deployment: ${timestamp}`
  
  if (!runCommand(`git commit -m "${commitMessage}"`, 'Committing changes')) {
    console.log('ℹ️  No changes to commit or commit failed')
  }
  
  // Push to origin
  if (!runCommand('git push origin main', 'Pushing to GitHub')) {
    process.exit(1)
  }
  
  console.log('=' * 60)
  console.log('🎉 [Commit & Push] All operations completed successfully!')
  console.log('📡 Changes pushed to GitHub - Choreo deployment should start automatically')
  console.log('🔗 Check Choreo console for deployment status')
  console.log('')
  console.log('🧪 Test endpoints after deployment:')
  console.log('   • Health: https://your-app.choreo.dev/api/health')
  console.log('   • Debug: https://your-app.choreo.dev/api/debug-choreo')
  console.log('   • Test: https://your-app.choreo.dev/api/test-simple')
  console.log('   • Root: https://your-app.choreo.dev/')
}

if (require.main === module) {
  main().catch(console.error)
} 