#!/usr/bin/env node

/**
 * Debug Authentication and Permissions
 */

const { PrismaClient } = require('@prisma/client');

async function debugAuth() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debug Authentication Flow...\n');
    
    // 1. Verificar usuario admin en DB
    console.log('1️⃣ Checking admin user in database:');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'alesierraalta@gmail.com' },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
    
    if (!adminUser) {
      console.error('❌ Admin user NOT found in database');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role?.name}`);
    console.log(`   Active: ${adminUser.isActive}`);
    console.log(`   Permissions: ${adminUser.role?.rolePermissions?.length || 0}`);
    
    // 2. Verificar permisos específicos
    console.log('\n2️⃣ Checking specific permissions:');
    const requiredPerms = ['users:view', 'users:create', 'settings:view', 'dashboard:view'];
    
    requiredPerms.forEach(permId => {
      const [resource, action] = permId.split(':');
      const hasIt = adminUser.role?.rolePermissions?.some(rp => 
        rp.permission.resource === resource && rp.permission.action === action
      );
      console.log(`   ${hasIt ? '✅' : '❌'} ${permId}`);
    });
    
    // 3. Probar API de autenticación
    console.log('\n3️⃣ Testing authentication API:');
    
    try {
      const fetch = require('node-fetch');
      
      // Test login
      console.log('Testing login...');
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'alesierraalta@gmail.com',
          password: 'admin123'
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Login API works');
        console.log(`   Response: ${JSON.stringify(loginData, null, 2)}`);
        
        // Extract cookie from response
        const setCookieHeader = loginResponse.headers.get('set-cookie');
        console.log(`   Set-Cookie: ${setCookieHeader}`);
        
        // Test /api/auth/me with cookie
        if (setCookieHeader) {
          console.log('\nTesting /api/auth/me with cookie...');
          const meResponse = await fetch('http://localhost:3000/api/auth/me', {
            headers: {
              'Cookie': setCookieHeader
            }
          });
          
          if (meResponse.ok) {
            const meData = await meResponse.json();
            console.log('✅ /api/auth/me works');
            console.log(`   User: ${JSON.stringify(meData.user, null, 2)}`);
          } else {
            console.log('❌ /api/auth/me failed');
            console.log(`   Status: ${meResponse.status}`);
            const errorText = await meResponse.text();
            console.log(`   Error: ${errorText}`);
          }
        }
        
      } else {
        console.log('❌ Login API failed');
        console.log(`   Status: ${loginResponse.status}`);
        const errorText = await loginResponse.text();
        console.log(`   Error: ${errorText}`);
      }
      
    } catch (error) {
      console.error('❌ Error testing API:', error.message);
      console.log('   Make sure the development server is running on http://localhost:3000');
    }
    
    // 4. Guía de solución
    console.log('\n4️⃣ Solution Guide:');
    console.log('1. Make sure you are logged in at http://localhost:3000/login');
    console.log('2. Use these credentials:');
    console.log('   Email: alesierraalta@gmail.com');
    console.log('   Password: admin123');
    console.log('3. After login, try accessing http://localhost:3000/settings/users');
    console.log('4. Check browser console for any JavaScript errors');
    console.log('5. Check Network tab in DevTools for failed API calls');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth(); 
 

/**
 * Debug Authentication and Permissions
 */

const { PrismaClient } = require('@prisma/client');

async function debugAuth() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debug Authentication Flow...\n');
    
    // 1. Verificar usuario admin en DB
    console.log('1️⃣ Checking admin user in database:');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'alesierraalta@gmail.com' },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
    
    if (!adminUser) {
      console.error('❌ Admin user NOT found in database');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role?.name}`);
    console.log(`   Active: ${adminUser.isActive}`);
    console.log(`   Permissions: ${adminUser.role?.rolePermissions?.length || 0}`);
    
    // 2. Verificar permisos específicos
    console.log('\n2️⃣ Checking specific permissions:');
    const requiredPerms = ['users:view', 'users:create', 'settings:view', 'dashboard:view'];
    
    requiredPerms.forEach(permId => {
      const [resource, action] = permId.split(':');
      const hasIt = adminUser.role?.rolePermissions?.some(rp => 
        rp.permission.resource === resource && rp.permission.action === action
      );
      console.log(`   ${hasIt ? '✅' : '❌'} ${permId}`);
    });
    
    // 3. Probar API de autenticación
    console.log('\n3️⃣ Testing authentication API:');
    
    try {
      const fetch = require('node-fetch');
      
      // Test login
      console.log('Testing login...');
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'alesierraalta@gmail.com',
          password: 'admin123'
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Login API works');
        console.log(`   Response: ${JSON.stringify(loginData, null, 2)}`);
        
        // Extract cookie from response
        const setCookieHeader = loginResponse.headers.get('set-cookie');
        console.log(`   Set-Cookie: ${setCookieHeader}`);
        
        // Test /api/auth/me with cookie
        if (setCookieHeader) {
          console.log('\nTesting /api/auth/me with cookie...');
          const meResponse = await fetch('http://localhost:3000/api/auth/me', {
            headers: {
              'Cookie': setCookieHeader
            }
          });
          
          if (meResponse.ok) {
            const meData = await meResponse.json();
            console.log('✅ /api/auth/me works');
            console.log(`   User: ${JSON.stringify(meData.user, null, 2)}`);
          } else {
            console.log('❌ /api/auth/me failed');
            console.log(`   Status: ${meResponse.status}`);
            const errorText = await meResponse.text();
            console.log(`   Error: ${errorText}`);
          }
        }
        
      } else {
        console.log('❌ Login API failed');
        console.log(`   Status: ${loginResponse.status}`);
        const errorText = await loginResponse.text();
        console.log(`   Error: ${errorText}`);
      }
      
    } catch (error) {
      console.error('❌ Error testing API:', error.message);
      console.log('   Make sure the development server is running on http://localhost:3000');
    }
    
    // 4. Guía de solución
    console.log('\n4️⃣ Solution Guide:');
    console.log('1. Make sure you are logged in at http://localhost:3000/login');
    console.log('2. Use these credentials:');
    console.log('   Email: alesierraalta@gmail.com');
    console.log('   Password: admin123');
    console.log('3. After login, try accessing http://localhost:3000/settings/users');
    console.log('4. Check browser console for any JavaScript errors');
    console.log('5. Check Network tab in DevTools for failed API calls');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth(); 
 