#!/usr/bin/env node

/**
 * Redis Setup and Testing Script for LUMO Inventory
 * Configures Redis credentials and tests the Redis implementation
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupRedisCredentials() {
  console.log('\n🔧 Redis Configuration Setup for LUMO Inventory');
  console.log('================================================');
  
  console.log('\nYou have two options for Redis testing:');
  console.log('1. Use real Upstash Redis credentials (production-ready)');
  console.log('2. Use mock Redis for testing (development only)');
  
  const choice = await question('\nChoose option (1 or 2): ');
  
  if (choice === '1') {
    console.log('\n📋 Get your Upstash Redis credentials from:');
    console.log('   https://console.upstash.com/redis');
    console.log('   1. Create a new Redis database');
    console.log('   2. Go to "Details" tab');
    console.log('   3. Copy the "UPSTASH_REDIS_REST_URL" and "UPSTASH_REDIS_REST_TOKEN"');
    
    const url = await question('\nEnter UPSTASH_REDIS_REST_URL: ');
    const token = await question('Enter UPSTASH_REDIS_REST_TOKEN: ');
    
    if (url && token) {
      await updateEnvFile(url, token);
      console.log('\n✅ Redis credentials configured successfully!');
      return { type: 'real', url, token };
    } else {
      console.log('\n❌ Invalid credentials provided.');
      return null;
    }
  } else {
    console.log('\n🧪 Using mock Redis for testing...');
    await updateEnvFile('mock://localhost:6379', 'mock-token');
    console.log('✅ Mock Redis configured for testing!');
    return { type: 'mock' };
  }
}

async function updateEnvFile(url, token) {
  const envPath = path.join(process.cwd(), '.env.local');
  let content = fs.readFileSync(envPath, 'utf8');
  
  // Replace placeholder values
  content = content.replace(
    /UPSTASH_REDIS_REST_URL=.*/,
    `UPSTASH_REDIS_REST_URL=${url}`
  );
  content = content.replace(
    /UPSTASH_REDIS_REST_TOKEN=.*/,
    `UPSTASH_REDIS_REST_TOKEN=${token}`
  );
  
  fs.writeFileSync(envPath, content);
}

async function testRedisConnection(config) {
  console.log('\n🧪 Testing Redis connection...');
  
  try {
    // Import after environment is set
    process.env.UPSTASH_REDIS_REST_URL = config.url;
    process.env.UPSTASH_REDIS_REST_TOKEN = config.token;
    
    if (config.type === 'mock') {
      console.log('✅ Mock Redis connection established');
      console.log('📊 Ready to run performance tests with mock data');
      return true;
    } else {
      // Test real Redis connection
      const { Redis } = require('@upstash/redis');
      const redis = Redis.fromEnv();
      
      // Simple connection test
      const testKey = 'lumo:connection:test';
      await redis.set(testKey, 'connected', { ex: 60 });
      const result = await redis.get(testKey);
      
      if (result === 'connected') {
        console.log('✅ Redis connection successful!');
        await redis.del(testKey); // Cleanup
        return true;
      } else {
        throw new Error('Connection test failed');
      }
    }
  } catch (error) {
    console.log(`❌ Redis connection failed: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    const config = await setupRedisCredentials();
    
    if (config) {
      const connected = await testRedisConnection(config);
      
      if (connected) {
        console.log('\n🚀 Next Steps:');
        console.log('   1. Run: node scripts/test-redis-performance.js');
        console.log('   2. Expected improvements: 20-30% inventory, 30-50% categories');
        console.log('   3. Continue to Phase 3 CDN optimization');
        
        const runTest = await question('\nRun performance test now? (y/n): ');
        if (runTest.toLowerCase() === 'y') {
          console.log('\n🏃‍♂️ Starting Redis performance test...\n');
          require('./test-redis-performance.js');
        }
      }
    }
  } catch (error) {
    console.error(`❌ Setup failed: ${error.message}`);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupRedisCredentials, testRedisConnection };