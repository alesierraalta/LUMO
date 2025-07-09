#!/usr/bin/env node

/**
 * LUMO - Authentication Flow Debugging Script
 * Comprehensive script to debug authentication issues
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuration
const SUPABASE_URL = 'https://ubjujxtvlubxowsphvuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4';
const PRODUCTION_URL = 'https://lumo-woad.vercel.app';

// Admin credentials
const ADMIN_EMAIL = 'alesierraalta@gmail.com';
const ADMIN_PASSWORD = 'admin123';

console.log('🔍 LUMO Authentication Flow Debugging');
console.log('=====================================');

class AuthFlowDebugger {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.session = null;
    this.user = null;
  }

  async step1_authenticate() {
    console.log('\n🔐 STEP 1: Authenticating with Supabase...');
    
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      throw authError;
    }

    this.session = authData.session;
    this.user = authData.user;
    
    console.log('✅ Authentication successful');
    console.log('📧 Email:', this.user.email);
    console.log('🆔 User ID:', this.user.id);
    console.log('🔑 Access Token (first 50 chars):', this.session.access_token.substring(0, 50) + '...');
    console.log('🔑 Token Type:', this.session.token_type);
    console.log('⏰ Expires at:', new Date(this.session.expires_at * 1000).toISOString());
    
    return this.session;
  }

  async step2_verifyToken() {
    console.log('\n🔍 STEP 2: Verifying token with Supabase...');
    
    const { data: userData, error: userError } = await this.supabase.auth.getUser(this.session.access_token);
    
    if (userError) {
      console.error('❌ Token verification failed:', userError.message);
      throw userError;
    }
    
    console.log('✅ Token verification successful');
    console.log('📧 Verified email:', userData.user.email);
    console.log('🆔 Verified user ID:', userData.user.id);
    console.log('🔄 Token is valid and active');
    
    return userData.user;
  }

  async step3_testDirectDatabaseQuery() {
    console.log('\n🗄️ STEP 3: Testing direct database query...');
    
    const { data: dbUser, error: dbError } = await this.supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        is_active,
        role_id,
        roles(id, name, description)
      `)
      .eq('email', ADMIN_EMAIL)
      .single();

    if (dbError) {
      console.error('❌ Database query failed:', dbError.message);
      throw dbError;
    }

    console.log('✅ Database query successful');
    console.log('👤 User from DB:', JSON.stringify(dbUser, null, 2));
    
    return dbUser;
  }

  async step4_testAPIWithToken() {
    console.log('\n🌐 STEP 4: Testing API with token...');
    
    const endpoints = [
      '/api/users',
      '/api/roles',
      '/api/permissions'
    ];

    for (const endpoint of endpoints) {
      console.log(`\n📡 Testing ${endpoint}...`);
      
      try {
        const response = await fetch(`${PRODUCTION_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Success! Data keys:`, Object.keys(data));
          if (data.users) console.log(`👥 Users count: ${data.users.length}`);
          if (data.roles) console.log(`🏷️ Roles count: ${data.roles.length}`);
          if (data.permissions) console.log(`🔐 Permissions count: ${data.permissions.length}`);
        } else {
          const errorText = await response.text();
          console.log(`❌ Error response:`, errorText);
        }
      } catch (error) {
        console.error(`❌ Request failed:`, error.message);
      }
    }
  }

  async step5_testTokenFormats() {
    console.log('\n🔧 STEP 5: Testing different token formats...');
    
    const tokenFormats = [
      { name: 'Bearer Token', value: `Bearer ${this.session.access_token}` },
      { name: 'Direct Token', value: this.session.access_token },
      { name: 'JWT Format', value: `JWT ${this.session.access_token}` }
    ];

    for (const format of tokenFormats) {
      console.log(`\n🧪 Testing ${format.name}...`);
      
      try {
        const response = await fetch(`${PRODUCTION_URL}/api/users`, {
          method: 'GET',
          headers: {
            'Authorization': format.value,
            'Content-Type': 'application/json',
          },
        });

        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          console.log(`✅ ${format.name} works!`);
        } else {
          const errorText = await response.text();
          console.log(`❌ ${format.name} failed:`, errorText.substring(0, 100) + '...');
        }
      } catch (error) {
        console.error(`❌ ${format.name} request failed:`, error.message);
      }
    }
  }

  async step6_testHealthEndpoint() {
    console.log('\n🏥 STEP 6: Testing health endpoint...');
    
    try {
      const response = await fetch(`${PRODUCTION_URL}/api/health`);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Health check successful');
        console.log('📊 Health data:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ Health check failed:', errorText);
      }
    } catch (error) {
      console.error('❌ Health check request failed:', error.message);
    }
  }

  async step7_inspectTokenPayload() {
    console.log('\n🔍 STEP 7: Inspecting token payload...');
    
    try {
      // Decode JWT token (basic decode, not verification)
      const tokenParts = this.session.access_token.split('.');
      if (tokenParts.length === 3) {
        const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        
        console.log('🏷️ Token Header:', JSON.stringify(header, null, 2));
        console.log('📦 Token Payload:', JSON.stringify(payload, null, 2));
        console.log('⏰ Token issued at:', new Date(payload.iat * 1000).toISOString());
        console.log('⏰ Token expires at:', new Date(payload.exp * 1000).toISOString());
        console.log('🎯 Token audience:', payload.aud);
        console.log('🏢 Token issuer:', payload.iss);
      } else {
        console.log('❌ Token is not a valid JWT format');
      }
    } catch (error) {
      console.error('❌ Failed to decode token:', error.message);
    }
  }

  async runFullDiagnostic() {
    try {
      await this.step1_authenticate();
      await this.step2_verifyToken();
      await this.step3_testDirectDatabaseQuery();
      await this.step4_testAPIWithToken();
      await this.step5_testTokenFormats();
      await this.step6_testHealthEndpoint();
      await this.step7_inspectTokenPayload();
      
      console.log('\n🎉 Full diagnostic completed!');
      console.log('📋 Summary:');
      console.log('   - Authentication: ✅ Working');
      console.log('   - Token verification: ✅ Working');
      console.log('   - Database access: ✅ Working');
      console.log('   - Check API responses above for specific issues');
      
    } catch (error) {
      console.error('\n❌ Diagnostic failed:', error.message);
      throw error;
    }
  }
}

// Command line interface
async function main() {
  const authDebugger = new AuthFlowDebugger();
  
  try {
    const command = process.argv[2];
    
    switch (command) {
      case 'full':
        await authDebugger.runFullDiagnostic();
        break;
        
      case 'auth':
        await authDebugger.step1_authenticate();
        break;
        
      case 'token':
        await authDebugger.step1_authenticate();
        await authDebugger.step2_verifyToken();
        break;
        
      case 'db':
        await authDebugger.step1_authenticate();
        await authDebugger.step3_testDirectDatabaseQuery();
        break;
        
      case 'api':
        await authDebugger.step1_authenticate();
        await authDebugger.step4_testAPIWithToken();
        break;
        
      case 'formats':
        await authDebugger.step1_authenticate();
        await authDebugger.step5_testTokenFormats();
        break;
        
      case 'health':
        await authDebugger.step6_testHealthEndpoint();
        break;
        
      default:
        console.log('\n📖 Usage:');
        console.log('  node scripts/debug-auth-flow.js full     - Run full diagnostic');
        console.log('  node scripts/debug-auth-flow.js auth     - Test authentication only');
        console.log('  node scripts/debug-auth-flow.js token    - Test token verification');
        console.log('  node scripts/debug-auth-flow.js db       - Test database query');
        console.log('  node scripts/debug-auth-flow.js api      - Test API endpoints');
        console.log('  node scripts/debug-auth-flow.js formats  - Test token formats');
        console.log('  node scripts/debug-auth-flow.js health   - Test health endpoint');
        break;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().then(() => {
    console.log('\n✅ Authentication Flow Debugging Complete');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
}

module.exports = AuthFlowDebugger; 