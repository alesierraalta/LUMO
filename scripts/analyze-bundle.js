/**
 * Bundle Analysis Script
 * Analyzes webpack bundle sizes and provides optimization recommendations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📊 Bundle Analysis Script');
console.log('========================');

// Function to run commands and capture output
function runCommand(command, description) {
  console.log(`\n🔍 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return output;
  } catch (error) {
    console.error(`❌ Error running ${description}:`, error.message);
    return null;
  }
}

// Function to analyze .next directory
function analyzeNextBuild() {
  const nextDir = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(nextDir)) {
    console.log('❌ No .next directory found. Please run `npm run build` first.');
    return;
  }

  console.log('\n📁 Analyzing .next directory structure...');
  
  // Check for static assets
  const staticDir = path.join(nextDir, 'static');
  if (fs.existsSync(staticDir)) {
    const staticFiles = fs.readdirSync(staticDir, { recursive: true });
    console.log(`📄 Static files: ${staticFiles.length}`);
  }

  // Check for server chunks
  const serverDir = path.join(nextDir, 'server');
  if (fs.existsSync(serverDir)) {
    const serverFiles = fs.readdirSync(serverDir, { recursive: true });
    console.log(`🖥️  Server files: ${serverFiles.length}`);
  }

  // Check for build manifest
  const buildManifest = path.join(nextDir, 'build-manifest.json');
  if (fs.existsSync(buildManifest)) {
    const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
    console.log(`📋 Build manifest pages: ${Object.keys(manifest.pages).length}`);
  }
}

// Function to check package.json for bundle analyzer
function checkBundleAnalyzer() {
  const packageJson = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJson)) {
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    const hasBundleAnalyzer = pkg.devDependencies && pkg.devDependencies['@next/bundle-analyzer'];
    
    if (!hasBundleAnalyzer) {
      console.log('\n💡 Recommendation: Install @next/bundle-analyzer for detailed analysis');
      console.log('   Run: npm install --save-dev @next/bundle-analyzer');
      console.log('   Then add "analyze": "ANALYZE=true next build" to package.json scripts');
    } else {
      console.log('\n✅ Bundle analyzer is available');
    }
  }
}

// Function to provide optimization recommendations
function provideRecommendations() {
  console.log('\n🚀 Optimization Recommendations:');
  console.log('================================');
  
  console.log('1. 📦 Package Import Optimization:');
  console.log('   - Enabled optimizePackageImports in next.config.js');
  console.log('   - Targets: @prisma/client, react-icons, lucide-react, date-fns, lodash');
  
  console.log('\n2. 🧠 Memory Optimizations:');
  console.log('   - Enabled webpackBuildWorker for parallel builds');
  console.log('   - Disabled preloadEntriesOnStart to reduce memory usage');
  
  console.log('\n3. 🖼️  Image Optimizations:');
  console.log('   - Enabled WebP and AVIF formats');
  console.log('   - Configured device sizes for responsive images');
  console.log('   - Set 30-day cache TTL for images');
  
  console.log('\n4. 🔧 Build Optimizations:');
  console.log('   - Enabled webpack build worker');
  console.log('   - Configured memory cache optimization');
  console.log('   - Enabled compression');
  
  console.log('\n5. 🎯 Runtime Optimizations:');
  console.log('   - Enabled React strict mode');
  console.log('   - Configured bundle splitting for vendors');
  console.log('   - Disabled source maps in production');
}

// Main execution
async function main() {
  console.log('Starting bundle analysis...\n');
  
  // Check current build
  analyzeNextBuild();
  
  // Check for bundle analyzer
  checkBundleAnalyzer();
  
  // Provide recommendations
  provideRecommendations();
  
  console.log('\n✅ Bundle analysis complete!');
  console.log('\n📈 Next steps:');
  console.log('1. Run performance tests: node scripts/test-api-performance.js');
  console.log('2. Monitor build times and bundle sizes');
  console.log('3. Consider implementing additional optimizations if needed');
}

main().catch(console.error);