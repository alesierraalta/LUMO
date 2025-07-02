#!/usr/bin/env node

/**
 * Test Browser Environment Variables
 * Create a client-side test to see what environment variables are available
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function testBrowserEnv() {
  console.log('🔍 TESTING BROWSER ENVIRONMENT VARIABLES');
  console.log('========================================');
  console.log(`Target URL: ${DEV_URL}`);
  console.log(`Test Time: ${new Date().toLocaleString()}\n`);
  
  try {
    // Create a simple test page to check client-side environment
    console.log('🧪 Creating browser environment test...');
    
    const testScript = `
      console.log('=== BROWSER ENVIRONMENT TEST ===');
      console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
      console.log('NODE_ENV:', process.env.NODE_ENV);
      
      // Also check if there are any hardcoded values
      const scripts = document.querySelectorAll('script');
      let foundHardcoded = false;
      
      scripts.forEach(script => {
        if (script.innerHTML.includes('ubjujxtvlubxowsphvuk')) {
          console.log('❌ Found hardcoded production URL in script:', script.innerHTML.substring(0, 100));
          foundHardcoded = true;
        }
      });
      
      if (!foundHardcoded) {
        console.log('✅ No hardcoded production URLs found in scripts');
      }
      
      // Test the actual Supabase client creation
      try {
        const { createClient } = require('@supabase/supabase-js');
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndprriqyhddjoixrlqnz.supabase.co';
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-key';
        
        console.log('Creating client with URL:', url);
        console.log('Creating client with key:', key.substring(0, 20) + '...');
        
        const client = createClient(url, key);
        console.log('✅ Client created successfully');
        
      } catch (error) {
        console.error('❌ Client creation error:', error.message);
      }
    `;
    
    console.log('📝 Browser test script created. To run this test:');
    console.log('1. Open browser developer console');
    console.log('2. Navigate to:', DEV_URL);
    console.log('3. Paste and run this script in the console:');
    console.log('');
    console.log('```javascript');
    console.log(testScript);
    console.log('```');
    console.log('');
    console.log('4. Check the console output to see what URLs are being used');
    
    // Also test if we can determine the issue from server-side
    console.log('🔍 Testing if the issue is in the build...');
    
    const response = await fetch(`${DEV_URL}/login`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Check if the HTML contains hardcoded production URLs
      if (html.includes('ubjujxtvlubxowsphvuk')) {
        console.log('❌ FOUND HARDCODED PRODUCTION URL IN HTML BUILD!');
        console.log('This means the build was created with production environment variables.');
        console.log('');
        console.log('🔧 SOLUTION:');
        console.log('1. Update environment variables in Choreo');
        console.log('2. Force a complete rebuild/redeploy');
        console.log('3. Clear browser cache');
      } else if (html.includes('ndprriqyhddjoixrlqnz')) {
        console.log('✅ HTML contains development URLs - build is correct');
        console.log('The issue might be in browser cache or client-side state');
        console.log('');
        console.log('🔧 SOLUTION:');
        console.log('1. Clear browser cache completely');
        console.log('2. Try incognito/private browsing mode');
        console.log('3. Check browser console for errors');
      } else {
        console.log('⚠️ No Supabase URLs found in HTML - might be dynamically loaded');
      }
    }
    
  } catch (error) {
    console.error('❌ Browser test error:', error.message);
  }
}

testBrowserEnv().catch(console.error); 