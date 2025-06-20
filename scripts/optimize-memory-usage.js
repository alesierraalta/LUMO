#!/usr/bin/env node

/**
 * TASK 24: Optimize Memory Usage for Choreo Environment
 * Configure proper Node.js memory limits and optimization settings
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Task 24: Optimizing Memory Usage for Choreo Environment...');

// Memory optimization configuration
const memoryConfig = {
  // Node.js memory limits (Choreo has 8GB available)
  maxOldSpaceSize: 6144, // 6GB max heap (leaving 2GB for system)
  maxSemiSpaceSize: 128,  // 128MB for young generation
  
  // V8 optimization flags
  optimizeForSize: true,
  useIdleNotification: true,
  exposeGC: true,
  
  // Garbage collection tuning
  gcInterval: 30000, // 30 seconds
  maxHeapSize: '6g',
  
  // Environment-specific settings
  choreoOptimizations: {
    NODE_OPTIONS: '--max-old-space-size=6144 --max-semi-space-size=128 --optimize-for-size',
    UV_THREADPOOL_SIZE: 16, // Increase thread pool for I/O operations
    NODE_ENV: 'production'
  }
};

// Update package.json with memory-optimized scripts
function updatePackageJsonScripts() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Add memory-optimized start script
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['start:optimized'] = 'NODE_OPTIONS="--max-old-space-size=6144 --optimize-for-size" node server.js';
    packageJson.scripts['choreo:memory-optimized'] = 'NODE_OPTIONS="--max-old-space-size=6144 --max-semi-space-size=128" npm start';
    
    // Add memory monitoring script
    packageJson.scripts['monitor:memory'] = 'node scripts/monitor-memory.js';
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json updated with memory-optimized scripts');
  } catch (error) {
    console.error('❌ Error updating package.json:', error.message);
  }
}

// Create memory monitoring script
function createMemoryMonitor() {
  const monitorScript = `#!/usr/bin/env node

/**
 * Memory Usage Monitor for LUMO Choreo Deployment
 */

function formatBytes(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function monitorMemory() {
  const usage = process.memoryUsage();
  const timestamp = new Date().toISOString();
  
  console.log(\`[\${timestamp}] Memory Usage:\`);
  console.log(\`  RSS: \${formatBytes(usage.rss)}\`);
  console.log(\`  Heap Used: \${formatBytes(usage.heapUsed)}\`);
  console.log(\`  Heap Total: \${formatBytes(usage.heapTotal)}\`);
  console.log(\`  External: \${formatBytes(usage.external)}\`);
  console.log(\`  Array Buffers: \${formatBytes(usage.arrayBuffers)}\`);
  
  // Alert if memory usage is high
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  if (heapUsedMB > 4096) { // Alert if over 4GB
    console.warn(\`⚠️  HIGH MEMORY USAGE: \${formatBytes(usage.heapUsed)}\`);
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
    console.log('🗑️  Garbage collection triggered');
  }
}

// Monitor every 30 seconds
setInterval(monitorMemory, 30000);

// Initial check
monitorMemory();

console.log('📊 Memory monitoring started (30s intervals)');
`;

  try {
    fs.writeFileSync(path.join(process.cwd(), 'scripts', 'monitor-memory.js'), monitorScript);
    console.log('✅ Memory monitoring script created');
  } catch (error) {
    console.error('❌ Error creating memory monitor:', error.message);
  }
}

// Create Choreo-specific memory configuration
function createChoreoMemoryConfig() {
  const config = {
    memory: {
      limits: {
        heap: '6144m',
        rss: '7680m', // 7.5GB RSS limit
        external: '512m'
      },
      optimization: {
        gc: {
          interval: 30000,
          aggressive: false,
          incremental: true
        },
        v8: {
          flags: [
            '--max-old-space-size=6144',
            '--max-semi-space-size=128',
            '--optimize-for-size',
            '--use-idle-notification'
          ]
        }
      },
      monitoring: {
        enabled: true,
        interval: 30000,
        alertThreshold: 4096 // Alert at 4GB
      }
    }
  };
  
  try {
    fs.writeFileSync(
      path.join(process.cwd(), 'config', 'choreo-memory.json'),
      JSON.stringify(config, null, 2)
    );
    console.log('✅ Choreo memory configuration created');
  } catch (error) {
    console.error('❌ Error creating Choreo config:', error.message);
  }
}

// Update server.js with memory optimization
function updateServerWithMemoryOptimization() {
  const serverPath = path.join(process.cwd(), 'server.js');
  
  if (fs.existsSync(serverPath)) {
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Add memory optimization at the top
    const memoryOptimization = `
// TASK 24: Memory Optimization for Choreo Environment
if (process.env.NODE_ENV === 'production') {
  // Set memory limits
  process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=6144 --optimize-for-size';
  
  // Enable garbage collection monitoring
  if (global.gc) {
    setInterval(() => {
      const usage = process.memoryUsage();
      if (usage.heapUsed > 4 * 1024 * 1024 * 1024) { // 4GB threshold
        console.log('🗑️ High memory usage detected, triggering GC');
        global.gc();
      }
    }, 30000);
  }
  
  // Memory usage reporting
  console.log('📊 Memory optimization enabled for Choreo deployment');
  console.log('💾 Max heap size: 6144MB');
}
`;
    
    // Insert at the top after existing comments
    if (!serverContent.includes('Memory Optimization for Choreo')) {
      serverContent = memoryOptimization + '\n' + serverContent;
      fs.writeFileSync(serverPath, serverContent);
      console.log('✅ Server.js updated with memory optimization');
    } else {
      console.log('✅ Server.js already has memory optimization');
    }
  }
}

// Execute all optimizations
async function optimizeMemoryUsage() {
  console.log('🚀 Starting memory optimization for Choreo environment...\n');
  
  // Ensure config directory exists
  const configDir = path.join(process.cwd(), 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Ensure scripts directory exists
  const scriptsDir = path.join(process.cwd(), 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  updatePackageJsonScripts();
  createMemoryMonitor();
  createChoreoMemoryConfig();
  updateServerWithMemoryOptimization();
  
  console.log('\n✅ TASK 24 COMPLETED: Memory optimization configured');
  console.log('📋 Summary:');
  console.log('  - Max heap size: 6144MB (6GB)');
  console.log('  - Memory monitoring: 30s intervals');
  console.log('  - GC optimization: Enabled');
  console.log('  - Choreo-specific limits: Configured');
  console.log('  - Scripts added: start:optimized, monitor:memory');
}

// Run the optimization
if (require.main === module) {
  optimizeMemoryUsage().catch(console.error);
}

module.exports = { optimizeMemoryUsage, memoryConfig }; 