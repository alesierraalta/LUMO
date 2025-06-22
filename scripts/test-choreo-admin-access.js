#!/usr/bin/env node

/**
 * Test Choreo Admin Access
 * Tests if the root user has admin access in the Choreo deployment
 */

const CHOREO_URL = 'https://lumo-1615540597-6c8cb9466f-w76w6-choreo.apps.cloudmobility.io';

async function testChoreoAdminAccess() {
    console.log('🧪 Testing Choreo Admin Access...\n');
    
    try {
        // Test 1: Health Check
        console.log('1️⃣ Testing Health Endpoint...');
        const healthResponse = await fetch(`${CHOREO_URL}/api/health`);
        const healthData = await healthResponse.json();
        console.log('   Status:', healthResponse.status);
        console.log('   Response:', JSON.stringify(healthData, null, 2));
        
        if (healthResponse.status !== 200) {
            console.log('❌ Health check failed - deployment may be down');
            return;
        }
        
        // Test 2: Login Test
        console.log('\n2️⃣ Testing Login Endpoint...');
        const loginResponse = await fetch(`${CHOREO_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'alesierraalta@gmail.com',
                password: 'test123' // Replace with actual password
            })
        });
        
        console.log('   Login Status:', loginResponse.status);
        const loginHeaders = Object.fromEntries(loginResponse.headers.entries());
        console.log('   Has Set-Cookie:', !!loginHeaders['set-cookie']);
        
        if (loginResponse.status === 200) {
            const loginData = await loginResponse.json();
            console.log('   Login Response:', JSON.stringify(loginData, null, 2));
            
            // Extract cookie if available
            const setCookieHeader = loginHeaders['set-cookie'];
            if (setCookieHeader) {
                console.log('   Cookie Set:', setCookieHeader.substring(0, 100) + '...');
                
                // Test 3: Auth Check with Cookie
                console.log('\n3️⃣ Testing Auth Check with Cookie...');
                const authResponse = await fetch(`${CHOREO_URL}/api/auth/me`, {
                    headers: {
                        'Cookie': setCookieHeader
                    }
                });
                
                console.log('   Auth Check Status:', authResponse.status);
                if (authResponse.status === 200) {
                    const authData = await authResponse.json();
                    console.log('   User Data:', JSON.stringify(authData, null, 2));
                    
                    if (authData.user?.role === 'ADMIN') {
                        console.log('\n✅ SUCCESS: User has ADMIN role in Choreo!');
                        console.log('🎯 The issue is NOT with admin permissions - user already has admin access');
                    } else {
                        console.log('\n❌ ISSUE FOUND: User role is not ADMIN');
                        console.log('   Current role:', authData.user?.role);
                    }
                } else {
                    console.log('   Auth check failed');
                }
            }
        } else {
            console.log('   Login failed - check credentials or endpoint');
        }
        
    } catch (error) {
        console.error('❌ Error testing Choreo deployment:', error.message);
        console.log('\n🔧 Possible issues:');
        console.log('   1. Choreo deployment is down');
        console.log('   2. Network connectivity issues');
        console.log('   3. URL has changed');
    }
}

// Run the test
testChoreoAdminAccess(); 