/**
 * @jest-environment node
 */

// Mock auth-server before importing anything else
jest.mock('@/lib/auth-server', () => {
  const mockModule = {
    getTokenFromRequest: jest.fn((request) => {
      const testName = expect.getState().currentTestName || '';
      
      // For unauthenticated tests
      if (testName.includes('unauthenticated')) {
        return null;
      }
      
      // For authenticated tests, extract token from Authorization header
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      return null;
    }),
    
    getCurrentUserFromToken: jest.fn(async (token) => {
      const testName = expect.getState().currentTestName || '';
      
      // For unauthenticated tests
      if (!token || testName.includes('unauthenticated')) {
        return null;
      }
      
      // For authenticated admin tests
      if (testName.includes('authenticated')) {
        return {
          id: 'admin-user-id',
          email: 'admin@test.com',
          role: 'ADMIN',
          permissions: ['admin'],
          isActive: true
        };
      }
      
      return null;
    }),
    
    getCurrentUser: jest.fn(async () => {
      const testName = expect.getState().currentTestName || '';
      
      // For unauthenticated tests
      if (testName.includes('unauthenticated')) {
        return null;
      }
      
      // For authenticated admin tests
      if (testName.includes('authenticated')) {
        return {
          id: 'admin-user-id',
          email: 'admin@test.com',
          role: 'ADMIN',
          permissions: ['admin'],
          isActive: true
        };
      }
      
      return null;
    }),
    
    hashPassword: jest.fn(async (password) => password),
    isAdmin: jest.fn((user) => user?.role === 'ADMIN'),
    isManager: jest.fn((user) => user?.role === 'MANAGER' || user?.role === 'ADMIN'),
    clearAuth: jest.fn(async () => {})
  };
  
  return mockModule;
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as createUserHandler } from '@/app/api/users/route';
import { DELETE as deleteUserHandler } from '@/app/api/users/[id]/route';
import { setupTestDatabase, cleanupTestDatabase, disconnectDatabase } from '../setup/test-utilities';
import { generateTestJWT, createTestUser, createTestRole } from '../setup/test-utilities';

describe('User API Error Cases', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
    jest.clearAllMocks();
  });

  describe('POST /api/users', () => {
    it('returns 401 when unauthenticated', async () => {
      const body = JSON.stringify({ 
        name: 'Test User', 
        email: 'test@example.com', 
        password: 'password123', 
        roleId: 'role-id', 
        isActive: true 
      });
      
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      
      const response = await createUserHandler(request);
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('returns 401 when unauthenticated', async () => {
      const request = new NextRequest('http://localhost/api/users/nonexistent', { 
        method: 'DELETE' 
      });
      
      const response = await deleteUserHandler(request, { 
        params: Promise.resolve({ id: 'nonexistent' }) 
      });
      
      expect(response.status).toBe(401);
    });

    it('returns 404 when deleting non-existent user (authenticated)', async () => {
      // Create an admin role first
      const adminRole = await createTestRole({
        name: 'ADMIN',
        description: 'Administrator role',
        permissions: ['admin']
      });
      
      // Create an admin user with the admin role
      const adminUser = await createTestUser({
        email: 'admin@test.com',
        roleId: adminRole.id,
        role: 'ADMIN',
        permissions: ['admin']
      });
      
      const token = generateTestJWT({
        userId: adminUser.id,
        email: adminUser.email,
        role: 'ADMIN',
        permissions: ['admin']
      });
      
      const headers = { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      };
      
      const request = new NextRequest('http://localhost/api/users/nonexistent', { 
        method: 'DELETE', 
        headers 
      });
      
      const response = await deleteUserHandler(request, { 
        params: Promise.resolve({ id: 'nonexistent' }) 
      });
      
      expect(response.status).toBe(404);
    });
  });
});
