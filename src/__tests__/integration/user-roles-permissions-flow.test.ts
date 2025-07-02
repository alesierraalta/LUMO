import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { setupTestDatabase, cleanupTestDatabase, createTestUser, createTestRole } from '../utils/test-optimization';
import { getSupabaseClient } from '@/lib/supabase-singleton';

describe('User Roles and Permissions Flow', () => {
  let supabase: any;
  let testUserId: string;
  let adminRoleId: string;
  let userRoleId: string;

  beforeEach(async () => {
    await setupTestDatabase();
    supabase = getSupabaseClient();
    
    // Create test roles
    adminRoleId = await createTestRole('ADMIN', ['all']);
    userRoleId = await createTestRole('USER', ['read']);
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('User Creation Flow', () => {
    it('should create user with email and password', async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';

      // Test user creation via API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Test User'
        })
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.user.email).toBe(testEmail);
      
      testUserId = result.user.id;
    });

    it('should reject duplicate email registration', async () => {
      const testEmail = `duplicate-${Date.now()}@example.com`;
      
      // Create first user
      await createTestUser(testEmail, 'password123');
      
      // Attempt duplicate registration
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'password456',
          name: 'Duplicate User'
        })
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });

    it('should validate password requirements', async () => {
      const testEmail = `weak-pass-${Date.now()}@example.com`;
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: '123', // Weak password
          name: 'Test User'
        })
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('password');
    });
  });

  describe('Role Assignment Flow', () => {
    beforeEach(async () => {
      testUserId = await createTestUser(`role-test-${Date.now()}@example.com`, 'password123');
    });

    it('should assign ADMIN role to user', async () => {
      const response = await fetch(`/api/users/${testUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: adminRoleId
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);

      // Verify role assignment in database
      const { data: user } = await supabase
        .from('users')
        .select('role_id, roles(name)')
        .eq('id', testUserId)
        .single();

      expect(user.role_id).toBe(adminRoleId);
      expect(user.roles.name).toBe('ADMIN');
    });

    it('should assign USER role to user', async () => {
      const response = await fetch(`/api/users/${testUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: userRoleId
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);

      // Verify role assignment
      const { data: user } = await supabase
        .from('users')
        .select('role_id, roles(name)')
        .eq('id', testUserId)
        .single();

      expect(user.role_id).toBe(userRoleId);
      expect(user.roles.name).toBe('USER');
    });

    it('should reject invalid role assignment', async () => {
      const response = await fetch(`/api/users/${testUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: 'invalid-role-id'
        })
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('role');
    });
  });

  describe('Permission Verification Flow', () => {
    let adminUserId: string;
    let regularUserId: string;

    beforeEach(async () => {
      // Create admin user
      adminUserId = await createTestUser(`admin-${Date.now()}@example.com`, 'password123');
      await fetch(`/api/users/${adminUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: adminRoleId })
      });

      // Create regular user
      regularUserId = await createTestUser(`user-${Date.now()}@example.com`, 'password123');
      await fetch(`/api/users/${regularUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: userRoleId })
      });
    });

    it('should allow ADMIN to access user management', async () => {
      // Simulate admin login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `admin-${Date.now()}@example.com`,
          password: 'password123'
        })
      });

      const { token } = await loginResponse.json();

      // Test admin access to users endpoint
      const usersResponse = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(usersResponse.status).toBe(200);
      const users = await usersResponse.json();
      expect(Array.isArray(users)).toBe(true);
    });

    it('should deny USER access to user management', async () => {
      // Simulate user login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `user-${Date.now()}@example.com`,
          password: 'password123'
        })
      });

      const { token } = await loginResponse.json();

      // Test user access to users endpoint (should be denied)
      const usersResponse = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(usersResponse.status).toBe(403);
      const result = await usersResponse.json();
      expect(result.error).toContain('permission');
    });

    it('should allow both roles to access their own profile', async () => {
      // Test admin accessing own profile
      const adminLoginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `admin-${Date.now()}@example.com`,
          password: 'password123'
        })
      });

      const { token: adminToken } = await adminLoginResponse.json();

      const adminProfileResponse = await fetch(`/api/users/${adminUserId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(adminProfileResponse.status).toBe(200);

      // Test user accessing own profile
      const userLoginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `user-${Date.now()}@example.com`,
          password: 'password123'
        })
      });

      const { token: userToken } = await userLoginResponse.json();

      const userProfileResponse = await fetch(`/api/users/${regularUserId}`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });

      expect(userProfileResponse.status).toBe(200);
    });
  });

  describe('Authentication Flow', () => {
    let testUser: any;

    beforeEach(async () => {
      const testEmail = `auth-test-${Date.now()}@example.com`;
      testUser = await createTestUser(testEmail, 'password123');
    });

    it('should authenticate valid credentials', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'password123'
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(testUser.email);
    });

    it('should reject invalid credentials', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'wrongpassword'
        })
      });

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('credentials');
    });

    it('should validate JWT token', async () => {
      // Login to get token
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'password123'
        })
      });

      const { token } = await loginResponse.json();

      // Validate token
      const validateResponse = await fetch('/api/auth/check-permissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(validateResponse.status).toBe(200);
      const result = await validateResponse.json();
      expect(result.valid).toBe(true);
      expect(result.user.email).toBe(testUser.email);
    });

    it('should reject expired/invalid tokens', async () => {
      const invalidToken = 'invalid.jwt.token';

      const response = await fetch('/api/auth/check-permissions', {
        headers: { 'Authorization': `Bearer ${invalidToken}` }
      });

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.valid).toBe(false);
    });
  });

  describe('Complete User Journey', () => {
    it('should complete full user lifecycle', async () => {
      const testEmail = `journey-${Date.now()}@example.com`;
      const testPassword = 'JourneyPassword123!';

      // 1. Register new user
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Journey Test User'
        })
      });

      expect(registerResponse.status).toBe(201);
      const registerResult = await registerResponse.json();
      const newUserId = registerResult.user.id;

      // 2. Login with new user
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });

      expect(loginResponse.status).toBe(200);
      const loginResult = await loginResponse.json();
      const userToken = loginResult.token;

      // 3. Verify initial permissions (should be limited)
      const initialPermissionsResponse = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });

      expect(initialPermissionsResponse.status).toBe(403); // Should be denied initially

      // 4. Admin assigns ADMIN role
      const roleAssignResponse = await fetch(`/api/users/${newUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: adminRoleId })
      });

      expect(roleAssignResponse.status).toBe(200);

      // 5. Re-login to get updated permissions
      const reLoginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });

      const reLoginResult = await reLoginResponse.json();
      const adminToken = reLoginResult.token;

      // 6. Verify enhanced permissions
      const enhancedPermissionsResponse = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(enhancedPermissionsResponse.status).toBe(200); // Should now be allowed

      // 7. User can now manage other users
      const userManagementResponse = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(userManagementResponse.status).toBe(200);
      const users = await userManagementResponse.json();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      const originalSupabase = supabase;
      supabase = null;

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.error).toContain('database');

      // Restore supabase
      supabase = originalSupabase;
    });

    it('should handle missing required fields', async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '', // Missing email
          password: 'password123'
        })
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('email');
    });

    it('should handle concurrent role assignments', async () => {
      const testUserId = await createTestUser(`concurrent-${Date.now()}@example.com`, 'password123');

      // Attempt concurrent role assignments
      const promises = [
        fetch(`/api/users/${testUserId}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId: adminRoleId })
        }),
        fetch(`/api/users/${testUserId}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId: userRoleId })
        })
      ];

      const results = await Promise.all(promises);
      
      // At least one should succeed
      const successCount = results.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });
  });
}); 