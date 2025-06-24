#!/usr/bin/env node

/**
 * Choreo Deployment Retry Script
 * Implements exponential backoff for DNS resolution issues
 */

const { execSync } = require('child_process');

const MAX_RETRIES = 5;
const BASE_DELAY = 30000; // 30 seconds

async function retryDeployment() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`🚀 Deployment attempt ${attempt}/${MAX_RETRIES}`);
    
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
      console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
    }
    
    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY * Math.pow(2, attempt - 1);
      console.log(`⏳ Waiting ${delay/1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.log('❌ All retry attempts failed');
  return false;
}

retryDeployment().catch(console.error);
