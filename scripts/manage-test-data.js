#!/usr/bin/env node

/**
 * LUMO - Test Data Management Script
 * Comprehensive script to create, view, and delete test data
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Configuration - using production environment
const SUPABASE_URL = 'https://ubjujxtvlubxowsphvuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4';

// Admin credentials
const ADMIN_EMAIL = 'alesierraalta@gmail.com';
const ADMIN_PASSWORD = 'admin123';

console.log('🚀 LUMO Test Data Management');
console.log('============================');

class TestDataManager {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.session = null;
  }

  async authenticate() {
    console.log('\n🔐 Authenticating as admin...');
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    this.session = authData.session;
    console.log('✅ Authentication successful');
    return this.session;
  }

  async getRoles() {
    console.log('\n📋 Fetching roles...');
    const { data: roles, error } = await this.supabase
      .from('roles')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }

    console.log('✅ Roles found:', roles.length);
    roles.forEach(role => {
      console.log(`   - ${role.name} (${role.id}): ${role.description}`);
    });

    return roles;
  }

  async getUsers() {
    console.log('\n👥 Fetching users...');
    const { data: users, error } = await this.supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        is_active,
        created_at,
        role_id,
        roles(name)
      `)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    console.log('✅ Users found:', users.length);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.roles?.name || 'No role'} - Active: ${user.is_active}`);
    });

    return users;
  }

  async createTestUser(userData) {
    console.log(`\n➕ Creating test user: ${userData.name}...`);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const { data: newUser, error } = await this.supabase
      .from('users')
      .insert({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role_id: userData.role_id,
        is_active: userData.is_active !== false
      })
      .select(`
        id,
        name,
        email,
        is_active,
        created_at,
        roles(name)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    console.log('✅ User created successfully');
    console.log('📊 User details:', JSON.stringify(newUser, null, 2));
    return newUser;
  }

  async deleteTestUser(email) {
    console.log(`\n🗑️ Deleting test user: ${email}...`);
    
    const { data: deletedUser, error } = await this.supabase
      .from('users')
      .delete()
      .eq('email', email)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    console.log('✅ User deleted successfully');
    console.log('📊 Deleted user:', deletedUser.name);
    return deletedUser;
  }

  async createTestUsers() {
    console.log('\n🏗️ Creating test users...');
    
    const roles = await this.getRoles();
    const adminRole = roles.find(r => r.name === 'ADMIN');
    const managerRole = roles.find(r => r.name === 'MANAGER');
    const userRole = roles.find(r => r.name === 'USER');

    const testUsers = [
      {
        name: 'Juan Manager',
        email: 'juan.manager@test.com',
        password: 'manager123',
        role_id: managerRole.id,
        is_active: true
      },
      {
        name: 'Maria Usuario',
        email: 'maria.usuario@test.com',
        password: 'user123',
        role_id: userRole.id,
        is_active: true
      },
      {
        name: 'Pedro Supervisor',
        email: 'pedro.supervisor@test.com',
        password: 'supervisor123',
        role_id: managerRole.id,
        is_active: true
      },
      {
        name: 'Ana Empleada',
        email: 'ana.empleada@test.com',
        password: 'empleada123',
        role_id: userRole.id,
        is_active: false
      }
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
      try {
        const user = await this.createTestUser(userData);
        createdUsers.push(user);
      } catch (error) {
        console.log(`❌ Failed to create ${userData.name}: ${error.message}`);
      }
    }

    console.log(`\n✅ Created ${createdUsers.length} test users`);
    return createdUsers;
  }

  async deleteTestUsers() {
    console.log('\n🧹 Cleaning up test users...');
    
    const testEmails = [
      'juan.manager@test.com',
      'maria.usuario@test.com',
      'pedro.supervisor@test.com',
      'ana.empleada@test.com'
    ];

    const deletedUsers = [];
    for (const email of testEmails) {
      try {
        const user = await this.deleteTestUser(email);
        deletedUsers.push(user);
      } catch (error) {
        console.log(`❌ Failed to delete ${email}: ${error.message}`);
      }
    }

    console.log(`\n✅ Deleted ${deletedUsers.length} test users`);
    return deletedUsers;
  }

  async testUserAPI() {
    console.log('\n🧪 Testing Users API...');
    
    if (!this.session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('https://lumo-woad.vercel.app/api/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful');
      console.log('👥 Users returned:', data.users?.length || 0);
      return data;
    } else {
      const errorData = await response.text();
      console.log('❌ API call failed');
      console.log('📄 Error:', errorData);
      throw new Error(`API call failed: ${response.status} ${errorData}`);
    }
  }

  async testUserCreationAPI(userData) {
    console.log('\n🧪 Testing User Creation API...');
    
    if (!this.session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('https://lumo-woad.vercel.app/api/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    console.log('📡 API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ User creation API successful');
      console.log('👤 Created user:', data.user?.name);
      return data;
    } else {
      const errorData = await response.text();
      console.log('❌ User creation API failed');
      console.log('📄 Error:', errorData);
      throw new Error(`API call failed: ${response.status} ${errorData}`);
    }
  }
}

// Command line interface
async function main() {
  const manager = new TestDataManager();
  
  try {
    await manager.authenticate();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'view':
        await manager.getRoles();
        await manager.getUsers();
        break;
        
      case 'create':
        await manager.createTestUsers();
        break;
        
      case 'delete':
        await manager.deleteTestUsers();
        break;
        
      case 'reset':
        await manager.deleteTestUsers();
        await manager.createTestUsers();
        break;
        
      case 'test-api':
        await manager.testUserAPI();
        break;
        
      case 'test-create-api':
        const roles = await manager.getRoles();
        const userRole = roles.find(r => r.name === 'USER');
        
        await manager.testUserCreationAPI({
          name: 'Test API User',
          email: 'test.api@test.com',
          password: 'test123',
          roleId: userRole.id,
          isActive: true
        });
        break;
        
      default:
        console.log('\n📖 Usage:');
        console.log('  node scripts/manage-test-data.js view          - View current data');
        console.log('  node scripts/manage-test-data.js create        - Create test users');
        console.log('  node scripts/manage-test-data.js delete        - Delete test users');
        console.log('  node scripts/manage-test-data.js reset         - Delete and recreate test users');
        console.log('  node scripts/manage-test-data.js test-api      - Test users API');
        console.log('  node scripts/manage-test-data.js test-create-api - Test user creation API');
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
    console.log('\n✅ Test Data Management Complete');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
}

module.exports = TestDataManager; 