#!/usr/bin/env node

/**
 * Check and Fix User Permissions
 * 
 * This script verifies the admin user permissions and fixes any issues
 */

const { PrismaClient } = require('@prisma/client');

async function checkUserPermissions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking user permissions...');
    
    // Find the admin user
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
      console.error('❌ Admin user not found');
      console.log('📝 Users in database:');
      const users = await prisma.user.findMany({
        select: { email: true, role: { select: { name: true } } }
      });
      console.table(users);
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Name: ${adminUser.name}`);
    console.log(`   - Active: ${adminUser.isActive}`);
    console.log(`   - Role: ${adminUser.role?.name || 'NO ROLE'}`);
    
    if (!adminUser.role) {
      console.error('❌ Admin user has no role assigned');
      
      // Find ADMIN role
      const adminRole = await prisma.role.findUnique({
        where: { name: 'ADMIN' }
      });
      
      if (adminRole) {
        console.log('🔧 Assigning ADMIN role...');
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { roleId: adminRole.id }
        });
        console.log('✅ ADMIN role assigned');
      } else {
        console.error('❌ ADMIN role not found in database');
        return;
      }
    }
    
    // Check permissions
    const permissionCount = adminUser.role?.rolePermissions?.length || 0;
    console.log(`📊 Permissions assigned: ${permissionCount}`);
    
    if (permissionCount < 20) {
      console.log('⚠️ Insufficient permissions. Expected at least 20 permissions.');
      console.log('🔧 Running admin setup to fix permissions...');
      
      // Import and run admin setup logic
      const { execSync } = require('child_process');
      try {
        execSync('node scripts/ensure-admin.js', { stdio: 'inherit' });
        console.log('✅ Admin setup completed');
      } catch (error) {
        console.error('❌ Error running admin setup:', error.message);
      }
    }
    
    // List critical permissions
    console.log('\n🎯 Critical permissions for sidebar:');
    const criticalPerms = ['dashboard:view', 'inventory:view', 'users:view', 'settings:view'];
    
    criticalPerms.forEach(permKey => {
      const [resource, action] = permKey.split(':');
      const hasIt = adminUser.role?.rolePermissions?.some(rp => 
        rp.permission.resource === resource && rp.permission.action === action
      );
      console.log(`   ${hasIt ? '✅' : '❌'} ${permKey}`);
    });
    
    // Show all permissions
    console.log('\n📋 All permissions:');
    if (adminUser.role?.rolePermissions) {
      adminUser.role.rolePermissions.forEach(rp => {
        console.log(`   - ${rp.permission.resource}:${rp.permission.action} (${rp.permission.name})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPermissions(); 
 

/**
 * Check and Fix User Permissions
 * 
 * This script verifies the admin user permissions and fixes any issues
 */

const { PrismaClient } = require('@prisma/client');

async function checkUserPermissions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking user permissions...');
    
    // Find the admin user
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
      console.error('❌ Admin user not found');
      console.log('📝 Users in database:');
      const users = await prisma.user.findMany({
        select: { email: true, role: { select: { name: true } } }
      });
      console.table(users);
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Name: ${adminUser.name}`);
    console.log(`   - Active: ${adminUser.isActive}`);
    console.log(`   - Role: ${adminUser.role?.name || 'NO ROLE'}`);
    
    if (!adminUser.role) {
      console.error('❌ Admin user has no role assigned');
      
      // Find ADMIN role
      const adminRole = await prisma.role.findUnique({
        where: { name: 'ADMIN' }
      });
      
      if (adminRole) {
        console.log('🔧 Assigning ADMIN role...');
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { roleId: adminRole.id }
        });
        console.log('✅ ADMIN role assigned');
      } else {
        console.error('❌ ADMIN role not found in database');
        return;
      }
    }
    
    // Check permissions
    const permissionCount = adminUser.role?.rolePermissions?.length || 0;
    console.log(`📊 Permissions assigned: ${permissionCount}`);
    
    if (permissionCount < 20) {
      console.log('⚠️ Insufficient permissions. Expected at least 20 permissions.');
      console.log('🔧 Running admin setup to fix permissions...');
      
      // Import and run admin setup logic
      const { execSync } = require('child_process');
      try {
        execSync('node scripts/ensure-admin.js', { stdio: 'inherit' });
        console.log('✅ Admin setup completed');
      } catch (error) {
        console.error('❌ Error running admin setup:', error.message);
      }
    }
    
    // List critical permissions
    console.log('\n🎯 Critical permissions for sidebar:');
    const criticalPerms = ['dashboard:view', 'inventory:view', 'users:view', 'settings:view'];
    
    criticalPerms.forEach(permKey => {
      const [resource, action] = permKey.split(':');
      const hasIt = adminUser.role?.rolePermissions?.some(rp => 
        rp.permission.resource === resource && rp.permission.action === action
      );
      console.log(`   ${hasIt ? '✅' : '❌'} ${permKey}`);
    });
    
    // Show all permissions
    console.log('\n📋 All permissions:');
    if (adminUser.role?.rolePermissions) {
      adminUser.role.rolePermissions.forEach(rp => {
        console.log(`   - ${rp.permission.resource}:${rp.permission.action} (${rp.permission.name})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPermissions(); 
 